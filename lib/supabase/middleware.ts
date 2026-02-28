import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/auth/callback', '/auth/forgot-password', '/auth/reset-password', '/', '/demo'];
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth page, redirect to dashboard
  if (user && path === '/auth') {
    // Check if profile is complete
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('is_profile_complete')
      .eq('user_id', user.id)
      .single();

    const url = request.nextUrl.clone();
    if (!profile || !profile.is_profile_complete) {
      url.pathname = '/onboarding';
    } else {
      url.pathname = '/dashboard/sme';
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
