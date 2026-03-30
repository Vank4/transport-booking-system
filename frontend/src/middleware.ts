import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PATHS = ['/admin'];
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiểm tra xem đây có phải route Admin không
  const isAdminRoute = ADMIN_PATHS.some(p => pathname.startsWith(p));
  const isAuthRoute = AUTH_PATHS.some(p => pathname.startsWith(p));

  // Đọc token và role từ cookie (được set bởi client-side auth)
  // Vì dùng localStorage phía client, middleware chỉ có thể đọc cookie.
  // Ta dùng cookie "userRole" để xác định quyền ở edge.
  const userRole = request.cookies.get('userRole')?.value;
  const hasToken = request.cookies.get('accessToken')?.value || 
                   request.cookies.get('token')?.value;

  if (isAdminRoute) {
    // Chưa đăng nhập → chuyển về login kèm redirect
    if (!hasToken) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Đã đăng nhập nhưng không phải Admin → chuyển về trang chủ
    if (userRole && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Nếu đã đăng nhập mà cố vào trang auth → chuyển về trang thích hợp
  if (isAuthRoute && hasToken) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Áp dụng cho Admin và Auth routes, bỏ qua static files
  matcher: ['/admin/:path*', '/auth/:path*'],
};
