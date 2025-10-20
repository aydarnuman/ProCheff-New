import { z } from 'zod';

export const KikInput = z.object({
  materials: z.number().nonnegative(),
  labor: z.number().nonnegative(),
  overhead: z.number().nonnegative(),
  profit: z.number().nonnegative(),
  k: z.literal(0.93).default(0.93),
});
export type KikInput = z.infer<typeof KikInput>;

export function calcThreshold(i: KikInput) {
  const total = i.materials + i.labor + i.overhead + i.profit;
  const thresholdValue = total * i.k;
  return { total, thresholdValue };
}

export function checkAsd(bid: number, thresholdValue: number) {
  return bid < thresholdValue;
}
