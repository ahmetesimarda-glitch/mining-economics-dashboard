import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  normalizeEquipmentCatalogInput,
  toOptionalJsonInput,
} from '@/lib/master-data';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

/**
 * GET /api/master-data/equipment/[id]
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const id = context?.params?.id;
    const item = await prisma.equipmentCatalogItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Ekipman bulunamadı' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error('Equipment catalog get:', error);
    const message = error instanceof Error ? error.message : 'Okunamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/master-data/equipment/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const id = context?.params?.id;
    const existing = await prisma.equipmentCatalogItem.findUnique({
      where: { id },
      select: { id: true, code: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Ekipman bulunamadı' }, { status: 404 });
    }

    const body: unknown = await request.json();
    const { data, error } = normalizeEquipmentCatalogInput(body, { requireModel: true });
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (data.code !== existing.code) {
      const conflict = await prisma.equipmentCatalogItem.findUnique({
        where: { code: data.code },
        select: { id: true },
      });
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: 'Bu kod zaten kullanılıyor' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.equipmentCatalogItem.update({
      where: { id },
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

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Equipment catalog update:', error);
    const message = error instanceof Error ? error.message : 'Güncellenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/master-data/equipment/[id]
 * Hard delete of the catalog row. Project Equipment snapshots are unaffected.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const id = context?.params?.id;
    const existing = await prisma.equipmentCatalogItem.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Ekipman bulunamadı' }, { status: 404 });
    }

    await prisma.equipmentCatalogItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Equipment catalog delete:', error);
    const message = error instanceof Error ? error.message : 'Silinemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
