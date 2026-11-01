import { PRICING } from "@/config/plans";
export function passValue(price: number, months: number) {
  const baseline = PRICING[0].price * months;
  return { perMonth: price / months, savings: baseline - price, savingPercent: Math.round((baseline - price) / baseline * 100) };
}
