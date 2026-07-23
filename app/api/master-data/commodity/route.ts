import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  normalizeCommodityCatalogInput,
  toCommodityCatalogPrismaData,
  type CommodityCatalogListResult,
} from '@/lib/master-data';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function buildWhere(searchParams: URLSearchParams): Prisma.CommodityCatalogItemWhereInput {
  const q = (searchParams.get('q') ?? '').trim();
  const isActive = searchParams.get('isActive');
  const where: Prisma.CommodityCatalogItemWhereInput = {};

  if (isActive === 'true') where.isActive = true;
  if (isActive === 'false') where.isActive = false;

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { nameTr: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { symbol: { contains: q, mode: 'insensitive' } },
      { searchAliases: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
}

/**
 * GET /api/master-data/commodity
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)
    );
    const where = buildWhere(searchParams);

    const [total, items] = await Promise.all([
      prisma.commodityCatalogItem.count({ where }),
      prisma.commodityCatalogItem.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const result: CommodityCatalogListResult = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Commodity catalog list:', error);
    const message = 'Catalog could not be loaded';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/master-data/commodity
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const { data, error } = normalizeCommodityCatalogInput(body);
    if (error || !data) {
      return NextResponse.json({ error: error ?? 'Invalid data' }, { status: 400 });
    }

    const existing = await prisma.commodityCatalogItem.findUnique({
      where: { code: data.code },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: 'This code is already in use' }, { status: 409 });
    }

    const item = await prisma.commodityCatalogItem.create({
      data: toCommodityCatalogPrismaData(data),
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    console.error('Commodity catalog create:', error);
    const message = 'Record could not be created';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
