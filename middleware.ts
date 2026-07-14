import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifySuperAdminToken } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Update the session via our utility
  const response = await updateSession(request);

  // We also want to check auth and redirect if not logged in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Super Admin Route Protection
  if (pathname.startsWith("/superadmin")) {
    const token = request.cookies.get("superadmin_auth")?.value;
    const isSuperAdminAuthed = token ? await verifySuperAdminToken(token) : false;

    if (pathname === "/superadmin/login") {
      if (isSuperAdminAuthed) {
        return NextResponse.redirect(new URL("/superadmin", request.url));
      }
      return response;
    }

    if (!isSuperAdminAuthed) {
      // Clear invalid/expired cookie
      const redirectResponse = NextResponse.redirect(new URL("/superadmin/login", request.url));
      redirectResponse.cookies.delete("superadmin_auth");
      return redirectResponse;
    }
    return response;
  }

  // Protect dashboard routes
  const protectedPaths = ["/dashboard", "/customers", "/settings", "/appointments", "/onboarding", "/whatsapp"];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access /login, redirect to dashboard
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If logged in, on a protected page (not onboarding), check if user has a shop
  // If no shop exists, redirect to onboarding
  if (user && isProtectedPath && pathname !== "/onboarding") {
    const { data: shop } = await supabase
      .from("shops")
      .select("id, status, subscription_status, trial_end, current_period_end")
      .eq("owner_id", user.id)
      .single();

    if (!shop) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (shop.status === 'banned') {
      return NextResponse.redirect(new URL("/banned", request.url));
    }

    // Paywall Check
    // If they are on a protected path that is NOT settings (we must allow them to go to settings to pay)
    if (!pathname.startsWith("/settings") && !pathname.startsWith("/api/payment")) {
      const isTrialing = shop.subscription_status === 'trialing';
      const isActive = shop.subscription_status === 'active';
      const now = new Date();
      
      let hasAccess = false;

      if (isActive) {
        if (shop.current_period_end && new Date(shop.current_period_end) > now) {
          hasAccess = true;
        } else if (!shop.current_period_end) {
          // Fallback if active but no period end
          hasAccess = true;
        }
      } else if (isTrialing) {
        if (shop.trial_end && new Date(shop.trial_end) > now) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        // Redirection to billing
        return NextResponse.redirect(new URL("/settings/billing", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
