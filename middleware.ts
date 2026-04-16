import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  // Not authenticated → redirect to login (except if already on login page)
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Authenticated on login page → redirect to dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Validate `active_agency_id` cookie against DB. If it points to a deleted
  // agency, clear it so subsequent calls to getActiveAgency() fall back to
  // the first existing agency instead of dragging a stale id through requests.
  if (user && !isLoginPage) {
    const activeAgencyCookie = request.cookies.get("active_agency_id")?.value;
    if (activeAgencyCookie) {
      const { data: agency } = await supabase
        .from("agencies")
        .select("id")
        .eq("id", activeAgencyCookie)
        .maybeSingle();
      if (!agency) {
        supabaseResponse.cookies.delete("active_agency_id");
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
