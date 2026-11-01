import { expect, it } from "vitest";
import { dsaCollection, isDsaRoot, learningHref } from "@/config/dsa";
import { passValue } from "@/lib/pricing";
it("defaults to the master and keeps collections and legacy progress separate", () => {
  expect(dsaCollection().key).toBe("master");
  expect(dsaCollection("unknown").key).toBe("master");
  expect(learningHref("dsa-a2z")).toBe("/dsa?collection=striver");
  expect(learningHref("dsa")).toBe("/dsa?collection=legacy");
  expect(isDsaRoot("dsa-neetcode150")).toBe(true);
  expect(isDsaRoot("os")).toBe(false);
  expect(learningHref("os")).toBe("/core/os");
});
it("compares pass savings to the actual one-month price", () => {
  expect(passValue(89, 1)).toEqual({ perMonth: 89, savings: 0, savingPercent: 0 });
  expect(passValue(219, 3)).toEqual({ perMonth: 73, savings: 48, savingPercent: 18 });
  expect(passValue(399, 6)).toEqual({ perMonth: 66.5, savings: 135, savingPercent: 25 });
});
