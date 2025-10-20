import { NextRequest, NextResponse } from 'next/server';
import { KikInput, calcThreshold, checkAsd } from '@/lib/analysis/kik';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = KikInput.parse(body);
    const { total, thresholdValue } = calcThreshold(input);
    const asdFlag = checkAsd(total, thresholdValue);
    return NextResponse.json({ ok: true, total, thresholdValue, k: input.k, asdFlag });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
  }
}
