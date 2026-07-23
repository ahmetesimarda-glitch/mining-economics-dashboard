export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const stripMeta = ({ id, projectId, ...rest }: any) => rest;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.miningProject.findUnique({
      where: { id: params?.id },
      include: {
        cashFlows: { orderBy: { year: 'asc' } },
        capexItems: true,
        opexItems: true,
        equipments: true,
        personnels: true,
        byProducts: true,
        methodCosts: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const p = project as any;
    const {
      id, createdAt, updatedAt,
      cashFlows, capexItems, opexItems, equipments, personnels, byProducts, methodCosts,
      ...scalarFields
    } = p;

    const newProject = await prisma.miningProject.create({
      data: {
        ...scalarFields,
        name: `${p?.name ?? 'Proje'} (Kopya)`,
        cashFlows: { create: (cashFlows ?? []).map(stripMeta) },
        capexItems: { create: (capexItems ?? []).map(stripMeta) },
        opexItems: { create: (opexItems ?? []).map(stripMeta) },
        equipments: { create: (equipments ?? []).map(stripMeta) },
        personnels: { create: (personnels ?? []).map(stripMeta) },
        byProducts: { create: (byProducts ?? []).map(stripMeta) },
        methodCosts: { create: (methodCosts ?? []).map(stripMeta) },
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error('Proje kopyalama hatası:', error);
    return NextResponse.json({ error: 'Project could not be duplicated' }, { status: 500 });
  }
}
