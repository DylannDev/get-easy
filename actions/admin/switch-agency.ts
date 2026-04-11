"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "active_agency_id";

export async function switchAgency(agencyId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, agencyId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    sameSite: "lax",
  });
}

export async function getActiveAgencyId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}
