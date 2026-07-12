export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sensitivityAnalysis,
  performFullAnalysis,
  type ProjectParams,
} from '@/lib/calculations';

function buildProjectParams(project: any): ProjectParams {
  return {
    projectLifeYears: project?.projectLifeYears ?? 30,
    discountRate: project?.discountRate ?? 5.82,
    taxRate: project?.taxRate ?? 22,
    royaltyRate: project?.royaltyRate ?? 4,
    creditRate: project?.creditRate ?? 4,
    creditYears: project?.creditYears ?? 10,
    unitPrice: project?.unitPrice ?? 75,
    annualProduction: project?.annualProduction ?? 2,
    plantProcessingRate: project?.plantProcessingRate ?? 35,
    equipmentCost: project?.equipmentCost ?? 0,
    facilityCost: project?.facilityCost ?? 0,
    infrastructureCost: project?.infrastructureCost ?? 0,
    contingencyRate: project?.contingencyRate ?? 10,
    totalCapex: project?.totalCapex ?? 0,
    fuelCost: project?.fuelCost ?? 0,
    personnelCost: project?.personnelCost ?? 0,
    maintenanceCost: project?.maintenanceCost ?? 0,
    explosivesCost: project?.explosivesCost ?? 0,
    tireCost: project?.tireCost ?? 0,
    strippingCost: project?.strippingCost ?? 0,
    otherOpex: project?.otherOpex ?? 0,
    totalOpex: project?.totalOpex ?? 0,
    forestCost: project?.forestCost ?? 0,
    landCost: project?.landCost ?? 0,
    rehabilitationCost: project?.rehabilitationCost ?? 0,
    annualStrippingVolume: project?.annualStrippingVolume ?? 0,
    strippingUnitCost: project?.strippingUnitCost ?? 1.05,
    contractorStrippingCost: project?.contractorStrippingCost ?? 0,
    plantOperatingCost: project?.plantOperatingCost ?? 0,
    equipmentDepLife: project?.equipmentDepLife ?? 6,
    facilityDepLife: project?.facilityDepLife ?? 15,
    byProductRevenue: project?.byProductRevenue ?? 0,
    fuelPricePerLiter: project?.fuelPricePerLiter ?? 0,
    electricityUnitPrice: project?.electricityUnitPrice ?? 0,
    explosiveUnitPrice: project?.explosiveUnitPrice ?? 0,
    totalReserves: project?.totalReserves ?? 0,
    maxAnnualCapacity: project?.maxAnnualCapacity ?? 0,
    oreGrade: project?.oreGrade ?? 0,
    exchangeRate: project?.exchangeRate ?? 1,
  };
}

type ParamKey = 'price' | 'capex' | 'opex' | 'discountRate' | 'oreGrade' | 'exchangeRate' | 'fuelPrice';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.miningProject.findUnique({
      where: { id: params?.id },
      include: {
        cashFlows: { orderBy: { year: 'asc' } },
        equipments: true,
        personnels: true,
        byProducts: true,
        methodCosts: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamad\u0131' }, { status: 404 });
    }

    // Gather all other projects for benchmarking
    const allProjects = await prisma.miningProject.findMany({
      select: {
        id: true, name: true, mineType: true, miningMethod: true,
        npv: true, irr: true, paybackPeriod: true, breakevenPrice: true,
        totalCapex: true, totalOpex: true, annualProduction: true,
        unitPrice: true, projectLifeYears: true, discountRate: true,
        fuelCost: true, personnelCost: true, maintenanceCost: true,
        explosivesCost: true, tireCost: true, strippingCost: true,
        totalRevenue: true, totalCost: true, equipmentCost: true,
        facilityCost: true, infrastructureCost: true,
        byProductRevenue: true,
      },
    });

    const otherProjects = allProjects.filter((p) => p.id !== project.id);

    // Compute sensitivity elasticities
    const projectParams = buildProjectParams(project);
    const baseAnalysis = performFullAnalysis(projectParams);
    const baseNpv = baseAnalysis?.npv ?? project.npv ?? 0;

    const paramKeys: ParamKey[] = ['price', 'capex', 'opex', 'discountRate', 'oreGrade', 'exchangeRate', 'fuelPrice'];
    const elasticities = paramKeys.map((p) => {
      const results = sensitivityAnalysis(projectParams, p, [-10, 10]);
      const npvDown = results?.[0]?.npv ?? 0;
      const npvUp = results?.[1]?.npv ?? 0;
      return {
        parameter: p,
        npvAt10Down: Math.round(npvDown * 100) / 100,
        npvAt10Up: Math.round(npvUp * 100) / 100,
        impact: Math.round(Math.abs(npvUp - npvDown) * 100) / 100,
        direction: npvUp > npvDown ? 'positive' : 'negative',
      };
    }).sort((a, b) => b.impact - a.impact);

    // Build cost breakdown
    const costBreakdown = {
      equipmentCost: project.equipmentCost ?? 0,
      facilityCost: project.facilityCost ?? 0,
      infrastructureCost: project.infrastructureCost ?? 0,
      totalCapex: project.totalCapex ?? 0,
      fuelCost: project.fuelCost ?? 0,
      personnelCost: project.personnelCost ?? 0,
      maintenanceCost: project.maintenanceCost ?? 0,
      explosivesCost: project.explosivesCost ?? 0,
      tireCost: project.tireCost ?? 0,
      strippingCost: project.strippingCost ?? 0,
      otherOpex: project.otherOpex ?? 0,
      totalOpex: project.totalOpex ?? 0,
    };

    // Build benchmark data
    const benchmarkData = otherProjects.map((p) => ({
      name: p.name,
      mineType: p.mineType,
      miningMethod: p.miningMethod,
      npv: p.npv,
      irr: p.irr,
      totalCapex: p.totalCapex,
      totalOpex: p.totalOpex,
      annualProduction: p.annualProduction,
      unitPrice: p.unitPrice,
      fuelCost: p.fuelCost,
      personnelCost: p.personnelCost,
      maintenanceCost: p.maintenanceCost,
    }));

    // Equipment summary
    const equipmentSummary = (project.equipments ?? []).map((e: any) => ({
      type: e.machineType,
      model: e.model,
      quantity: e.quantity,
      spare: e.spareQuantity,
      unitCost: e.unitCost,
      totalCost: e.totalCost,
      fuelConsumption: e.hourlyFuelConsumption,
      maintenanceCost: e.maintenanceCost,
    }));

    const personnelSummary = (project.personnels ?? []).map((p: any) => ({
      role: p.role,
      count: p.count,
      monthlySalary: p.monthlySalary,
      annualCost: p.annualCost,
    }));

    // Build comprehensive prompt
    const prompt = `Sen bir maden ekonomisi uzman\u0131s\u0131n. A\u015fa\u011f\u0131daki maden projesinin ekonomik verilerini analiz et ve detayl\u0131 optimizasyon \u00f6nerileri sun.

## PROJE B\u0130LG\u0130LER\u0130
- Proje Ad\u0131: ${project.name}
- Maden T\u00fcr\u00fc: ${project.mineType}
- Y\u00f6ntem: ${project.miningMethod === 'openPit' ? 'A\u00e7\u0131k Ocak' : 'Yer Alt\u0131'}
- Proje \u00d6mr\u00fc: ${project.projectLifeYears} y\u0131l
- \u0130skonto Oran\u0131: %${project.discountRate}
- Y\u0131ll\u0131k \u00dcretim: ${project.annualProduction} Mton
- Birim Fiyat: ${project.unitPrice} USD/ton

## F\u0130NANSAL SONU\u00c7LAR
- NPV: ${(project.npv ?? 0).toFixed(2)} MUSD
- IRR: %${(project.irr ?? 0).toFixed(2)}
- Geri \u00d6deme S\u00fcresi: ${(project.paybackPeriod ?? 0).toFixed(1)} y\u0131l
- Ba\u015faba\u015f Fiyat\u0131: ${(project.breakevenPrice ?? 0).toFixed(2)} USD/ton

## MAL\u0130YET DA\u011eILIMI (MUSD)
### CAPEX:
- Ekipman: ${costBreakdown.equipmentCost.toFixed(2)}
- Tesis: ${costBreakdown.facilityCost.toFixed(2)}
- Altyap\u0131: ${costBreakdown.infrastructureCost.toFixed(2)}
- Toplam CAPEX: ${costBreakdown.totalCapex.toFixed(2)}

### OPEX (Y\u0131ll\u0131k):
- Yak\u0131t: ${costBreakdown.fuelCost.toFixed(2)}
- Personel: ${costBreakdown.personnelCost.toFixed(2)}
- Bak\u0131m: ${costBreakdown.maintenanceCost.toFixed(2)}
- Patlay\u0131c\u0131: ${costBreakdown.explosivesCost.toFixed(2)}
- Lastik: ${costBreakdown.tireCost.toFixed(2)}
- Dekapaj: ${costBreakdown.strippingCost.toFixed(2)}
- Di\u011fer: ${costBreakdown.otherOpex.toFixed(2)}
- Toplam OPEX: ${costBreakdown.totalOpex.toFixed(2)}

## EK\u0130PMAN DETAYI
${equipmentSummary.map((e: any) => `- ${e.type} (${e.model}): ${e.quantity} adet + ${e.spare} yedek, birim ${e.unitCost} MUSD, yak\u0131t ${e.fuelConsumption} L/saat`).join('\n')}

## PERSONEL DETAYI
${personnelSummary.map((p: any) => `- ${p.role}: ${p.count} ki\u015fi, ayl\u0131k ${p.monthlySalary} MUSD, y\u0131ll\u0131k ${(p.annualCost ?? 0).toFixed(3)} MUSD`).join('\n')}

## DUYARLILIK ELAST\u0130KLER\u0130 (\u00b1%10)
${elasticities.map((e) => `- ${e.parameter}: Etki=${e.impact} MUSD, -%10'da NPV=${e.npvAt10Down}, +%10'da NPV=${e.npvAt10Up}`).join('\n')}

## BENCHMARK: D\u0130\u011eER PROJELER\u0130N VER\u0130LER\u0130
${benchmarkData.map((b) => `- ${b.name} (${b.mineType}, ${b.miningMethod}): NPV=${(b.npv ?? 0).toFixed(1)}, IRR=%${(b.irr ?? 0).toFixed(1)}, CAPEX=${(b.totalCapex ?? 0).toFixed(1)}, OPEX=${(b.totalOpex ?? 0).toFixed(1)}, \u00dcretim=${b.annualProduction} Mton, Fiyat=${b.unitPrice} USD/ton, Yak\u0131t=${(b.fuelCost ?? 0).toFixed(2)}, Personel=${(b.personnelCost ?? 0).toFixed(2)}, Bak\u0131m=${(b.maintenanceCost ?? 0).toFixed(2)}`).join('\n')}

L\u00fctfen a\u015fa\u011f\u0131daki JSON format\u0131nda yan\u0131t ver. T\u00fcrk\u00e7e yaz. Markdown kullanma, d\u00fcz metin yaz.

{
  "overallScore": <1-100 aras\u0131 proje skoru>,
  "overallVerdict": "<2-3 c\u00fcmlelik genel de\u011ferlendirme>",
  "npvDrivers": [
    {
      "factor": "<NPV'yi en \u00e7ok etkileyen fakt\u00f6r ad\u0131>",
      "impact": "<y\u00fcksek/orta/d\u00fc\u015f\u00fck>",
      "currentValue": "<mevcut de\u011fer>",
      "benchmarkAvg": "<di\u011fer projelerin ortalamas\u0131>",
      "deviation": "<sapma y\u00fczde veya MUSD>",
      "explanation": "<neden \u00f6nemli, 1-2 c\u00fcmle>"
    }
  ],
  "costOptimizations": [
    {
      "category": "<maliyet kalemi>",
      "currentCost": "<mevcut maliyet MUSD>",
      "benchmarkCost": "<benchmark MUSD>",
      "savingPotential": "<tasarruf potansiyeli MUSD>",
      "recommendation": "<somut \u00f6neri, 2-3 c\u00fcmle>",
      "difficulty": "<kolay/orta/zor>",
      "npvImpact": "<NPV'ye tahmini etki MUSD>"
    }
  ],
  "revenueOptimizations": [
    {
      "strategy": "<gelir art\u0131rma stratejisi>",
      "description": "<a\u00e7\u0131klama, 2-3 c\u00fcmle>",
      "potentialGain": "<potansiyel kazan\u00e7 MUSD>",
      "feasibility": "<y\u00fcksek/orta/d\u00fc\u015f\u00fck>"
    }
  ],
  "riskWarnings": [
    {
      "risk": "<risk ad\u0131>",
      "severity": "<kritik/y\u00fcksek/orta/d\u00fc\u015f\u00fck>",
      "description": "<a\u00e7\u0131klama>",
      "mitigation": "<azaltma \u00f6nerisi>"
    }
  ],
  "actionPlan": [
    {
      "priority": <1-5>,
      "action": "<eylem>",
      "expectedImpact": "<beklenen etki>",
      "timeframe": "<zaman \u00e7er\u00e7evesi>"
    }
  ]
}

Sadece ge\u00e7erli JSON d\u00f6nd\u00fcr, ba\u015fka metin ekleme. Code block kullanma.`;

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key yap\u0131land\u0131r\u0131lmam\u0131\u015f' }, { status: 500 });
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        messages: [
          { role: 'system', content: 'Sen deneyimli bir maden m\u00fchendisi ve ekonomist olarak projelerin finansal optimizasyonunu yap\u0131yorsun. Her zaman somut, say\u0131sal ve uygulanabilir \u00f6neriler ver. T\u00fcrkiye madencilik sekt\u00f6r\u00fc hakk\u0131nda derin bilgin var.' },
          { role: 'user', content: prompt },
        ],
        stream: true,
        max_tokens: 8000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('LLM API error:', errText);
      if (errText?.includes('no remaining credits') || errText?.includes('credit')) {
        return NextResponse.json({ error: 'API kredi limiti dolmuş. Lütfen daha sonra tekrar deneyin.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'AI analiz servisi yanıt vermedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }

    // Stream the response
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'Stream okunam\u0131yor' }, { status: 500 });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Robust JSON repair: strip code fences, fix truncation, extract JSON object
    function repairAndParseJSON(raw: string): any {
      let cleaned = raw.trim();
      // Strip markdown code fences
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      cleaned = cleaned.trim();

      // Try direct parse
      try { return JSON.parse(cleaned); } catch {}

      // Try to extract outermost JSON object
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try { return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)); } catch {}
      }

      // If JSON is truncated, try to close it
      if (firstBrace !== -1) {
        let jsonStr = cleaned.slice(firstBrace);
        // Remove trailing incomplete key-value
        jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*"[^"]*$/s, '');
        jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*$/s, '');
        let openBraces = 0, openBrackets = 0;
        let inStr = false, esc = false;
        for (const ch of jsonStr) {
          if (esc) { esc = false; continue; }
          if (ch === '\\' && inStr) { esc = true; continue; }
          if (ch === '"') { inStr = !inStr; continue; }
          if (inStr) continue;
          if (ch === '{') openBraces++;
          if (ch === '}') openBraces--;
          if (ch === '[') openBrackets++;
          if (ch === ']') openBrackets--;
        }
        let suffix = '';
        for (let i = 0; i < openBrackets; i++) suffix += ']';
        for (let i = 0; i < openBraces; i++) suffix += '}';
        if (suffix) {
          try { return JSON.parse(jsonStr + suffix); } catch {}
        }
      }
      return null;
    }

    function finalizeBuffer(buf: string, ctrl: ReadableStreamDefaultController, enc: TextEncoder) {
      const parsed = repairAndParseJSON(buf);
      if (parsed && parsed.overallScore !== undefined) {
        const d = JSON.stringify({ status: 'completed', result: parsed });
        ctrl.enqueue(enc.encode(`data: ${d}\n\n`));
      } else {
        // Send raw so client can attempt its own repair
        const d = JSON.stringify({ status: 'completed', result: { raw: buf } });
        ctrl.enqueue(enc.encode(`data: ${d}\n\n`));
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        let partialRead = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  finalizeBuffer(buffer, controller, encoder);
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const chunk = parsed.choices?.[0]?.delta?.content || '';
                  buffer += chunk;
                  const progressData = JSON.stringify({ status: 'processing', message: 'Analiz ediliyor...' });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch {
                  // Skip invalid JSON chunk
                }
              }
            }
          }
          if (buffer) {
            finalizeBuffer(buffer, controller, encoder);
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          const errData = JSON.stringify({ status: 'error', message: error?.message ?? 'Stream hatası' });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}