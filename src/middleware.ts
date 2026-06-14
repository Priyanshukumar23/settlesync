import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  const publicPaths = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register']
  if (publicPaths.includes(path) || path.startsWith('/_next') || path.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('settlesync_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
