export type PlanId = "basic" | "pro" | "business";

export const PLAN_PRICE_IDS: Record<PlanId, string> = {
  basic: "price_1TqqvG2VNTDoEjKI4Rq3h3aY",
  pro: "price_1Tqr032VNTDoEjKIkyKMTO6J",
  business: "price_1Tqr1q2VNTDoEjKI8pVhheGH",
};

export const PLAN_CREDITS: Record<PlanId, number> = {
  basic: 500,
  pro: 2000,
  business: 999999,
};

export function priceIdToPlan(priceId: string): PlanId | null {
  const entry = (Object.entries(PLAN_PRICE_IDS) as Array<[PlanId, string]>).find(
    ([, id]) => id === priceId,
  );
  return entry ? entry[0] : null;
}