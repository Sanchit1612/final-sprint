import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const { exchange } = vi.hoisted(() => ({ exchange: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }),
}));

import { GET } from "./route";

beforeEach(() => exchange.mockReset());

it("exchanges a signup confirmation code before sending the user to onboarding", async () => {
  exchange.mockResolvedValue({ error: null });
  const result = await GET(new NextRequest("http://localhost:3000/auth/callback?code=signup-code&next=%2Fonboarding"));
  expect(exchange).toHaveBeenCalledWith("signup-code");
  expect(result.headers.get("location")).toBe("http://localhost:3000/onboarding");
});

it("returns an expired or wrong-browser confirmation to sign-in", async () => {
  exchange.mockResolvedValue({ error: { message: "Code expired" } });
  const result = await GET(new NextRequest("http://localhost:3000/auth/callback?code=expired&next=%2Fonboarding"));
  const destination = new URL(result.headers.get("location")!);
  expect(destination.pathname).toBe("/login");
  expect(destination.searchParams.get("error")).toMatch(/expired/i);
});
