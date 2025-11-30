import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      // Return response without Supabase client if env vars are missing
      return NextResponse.next({
        request,
      })
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            } catch (error) {
              console.error('Error setting cookies in middleware:', error)
              // Continue with the response even if cookie setting fails
            }
          },
        },
      }
    )

    // AUTH DISABLED FOR DEVELOPMENT - All routes are accessible without login
    // Refresh session if expired - required for Server Components
    // try {
    //   const {
    //     data: { user },
    //   } = await supabase.auth.getUser()

    //   // Don't redirect from /home - let the page handle login UI
    //   // Only protect other authenticated routes
    //   const protectedRoutes = ['/history', '/mood', '/patterns', '/recipes']
    //   const isProtectedRoute = protectedRoutes.some(route => 
    //     request.nextUrl.pathname.startsWith(route)
    //   )

    //   if (!user && isProtectedRoute) {
    //     const url = request.nextUrl.clone()
    //     url.pathname = '/home'
    //     return NextResponse.redirect(url)
    //   }

    //   // Redirect authenticated users away from auth pages to home
    //   if (user && (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/signup'))) {
    //     const url = request.nextUrl.clone()
    //     url.pathname = '/home'
    //     return NextResponse.redirect(url)
    //   }
    // } catch (error) {
    //   // If auth check fails, allow the request to continue
    //   // Client-side components will handle auth errors
    //   console.error('Middleware auth check error:', error)
    // }

    return supabaseResponse
  } catch (error) {
    // If middleware fails, log the error and return a response to prevent the request from hanging
    console.error('Middleware error:', error)
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

