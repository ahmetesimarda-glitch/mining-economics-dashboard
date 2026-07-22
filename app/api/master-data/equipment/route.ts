import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  buildEquipmentCatalogWhere,
  normalizeEquipmentCatalogInput,
  toEquipmentCatalogPrismaData,
  type EquipmentCatalogListResult,
} from '@/lib/master-data';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type CatalogItem = Prisma.EquipmentCatalogItemGetPayload<object>;

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
 * List + search (OEM aliases) + manufacturer/category/active filters + pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)
    );
    const orderBy = parseSort(searchParams.get('sort'), searchParams.get('order'));

    const where = buildEquipmentCatalogWhere({
      q: searchParams.get('q'),
      category: searchParams.get('category'),
      manufacturer: searchParams.get('manufacturer'),
      powerType: searchParams.get('powerType'),
      isActive: searchParams.get('isActive'),
    });

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
      return NextResponse.json({ error: 'Bu kod zaten kullanılıyor' }, { status: 409 });
    }

    const duplicate = await prisma.equipmentCatalogItem.findFirst({
      where: {
        manufacturer: { equals: data.manufacturer, mode: 'insensitive' },
        model: { equals: data.model, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Bu üretici ve model zaten katalogda mevcut' },
        { status: 409 }
      );
    }

    const item = await prisma.equipmentCatalogItem.create({
      data: toEquipmentCatalogPrismaData(data),
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    console.error('Equipment catalog create:', error);
    const message = error instanceof Error ? error.message : 'Oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
