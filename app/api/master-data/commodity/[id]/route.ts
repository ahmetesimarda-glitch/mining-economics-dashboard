import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  normalizeCommodityCatalogInput,
  toCommodityCatalogPrismaData,
} from '@/lib/master-data';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const item = await prisma.commodityCatalogItem.findUnique({
      where: { id: context.params.id },
    });
    if (!item) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error('Commodity catalog get:', error);
    const message = 'Record could not be read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const existing = await prisma.commodityCatalogItem.findUnique({
      where: { id: context.params.id },
      select: { id: true, code: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const body: unknown = await request.json();
    const { data, error } = normalizeCommodityCatalogInput(body);
    if (error || !data) {
      return NextResponse.json({ error: error ?? 'Invalid data' }, { status: 400 });
    }

    if (data.code !== existing.code) {
      const clash = await prisma.commodityCatalogItem.findUnique({
        where: { code: data.code },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json({ error: 'This code is already in use' }, { status: 409 });
      }
    }

    const item = await prisma.commodityCatalogItem.update({
      where: { id: context.params.id },
      data: toCommodityCatalogPrismaData(data),
    });
    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error('Commodity catalog update:', error);
    const message = 'Record could not be updated';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const existing = await prisma.commodityCatalogItem.findUnique({
      where: { id: context.params.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    await prisma.commodityCatalogItem.delete({ where: { id: context.params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Commodity catalog delete:', error);
    const message = 'Record could not be deleted';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
