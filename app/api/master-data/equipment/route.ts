import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  normalizeEquipmentCatalogInput,
  toOptionalJsonInput,
  type EquipmentCatalogListResult,
} from '@/lib/master-data';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type CatalogItem = Prisma.EquipmentCatalogItemGetPayload<object>;

function parseBooleanFilter(raw: string | null): boolean | 'all' {
  if (raw === null || raw === '' || raw === 'all') return 'all';
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return 'all';
}

function parseSort(
  sortRaw: string | null,
  orderRaw: string | null
): Prisma.EquipmentCatalogItemOrderByWithRelationInput {
  const order: Prisma.SortOrder = orderRaw === 'desc' ? 'desc' : 'asc';
  switch (sortRaw) {
    case 'manufacturer':
      return { manufacturer: order };
    case 'category':
      return { category: order };
    case 'purchasePriceUsd':
      return { purchasePriceUsd: order };
    case 'updatedAt':
      return { updatedAt: order };
    case 'sortOrder':
      return { sortOrder: order };
    case 'model':
    default:
      return { model: order };
  }
}

/**
 * GET /api/master-data/equipment
 * List + search + filter + pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') ?? '').trim();
    const category = (searchParams.get('category') ?? '').trim();
    const manufacturer = (searchParams.get('manufacturer') ?? '').trim();
    const isActive = parseBooleanFilter(searchParams.get('isActive'));
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)
    );
    const orderBy = parseSort(searchParams.get('sort'), searchParams.get('order'));

    const where: Prisma.EquipmentCatalogItemWhereInput = {};
    if (category) where.category = category;
    if (manufacturer) {
      where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    }
    if (isActive !== 'all') where.isActive = isActive;
    if (q) {
      where.OR = [
        { model: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { capacityLabel: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.equipmentCatalogItem.count({ where }),
      prisma.equipmentCatalogItem.findMany({
        where,
        orderBy: [orderBy, { sortOrder: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const result: EquipmentCatalogListResult<CatalogItem> = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Equipment catalog list:', error);
    const message = error instanceof Error ? error.message : 'Liste alınamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/master-data/equipment
 * Create a catalog item.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const { data, error } = normalizeEquipmentCatalogInput(body, { requireModel: true });
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const existing = await prisma.equipmentCatalogItem.findUnique({
      where: { code: data.code },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Bu kod zaten kullanılıyor' },
        { status: 409 }
      );
    }

    const created = await prisma.equipmentCatalogItem.create({
      data: {
        code: data.code,
        manufacturer: data.manufacturer,
        model: data.model,
        category: data.category,
        description: data.description,
        capacityLabel: data.capacityLabel,
        payloadTons: data.payloadTons,
        bucketCapacityM3: data.bucketCapacityM3,
        enginePowerKw: data.enginePowerKw,
        operatingWeightTons: data.operatingWeightTons,
        purchasePriceUsd: data.purchasePriceUsd,
        fuelConsumptionLph: data.fuelConsumptionLph,
        usefulLifeYears: data.usefulLifeYears,
        availabilityPct: data.availabilityPct,
        maintenanceCostUsdYear: data.maintenanceCostUsdYear,
        powerType: data.powerType,
        extraSpecs: toOptionalJsonInput(data.extraSpecs),
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error('Equipment catalog create:', error);
    const message = error instanceof Error ? error.message : 'Oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
