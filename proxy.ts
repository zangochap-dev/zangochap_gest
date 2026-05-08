import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const currentUser = request.cookies.get("zc_session")?.value;
  const currentCustomer = request.cookies.get("zc_customer")?.value;
  const { pathname } = request.nextUrl;

  // Paths that are ALWAYS public (storefront)
  const isPublicPath = 
    pathname === "/" || 
    pathname === "/shop" ||
    pathname === "/search" ||
    pathname.startsWith("/product/") || 
    pathname.startsWith("/search") ||
    pathname === "/cart" ||
    pathname.startsWith("/compte") ||
    pathname === "/zangochap-manager";

  // If NOT logged in (neither staff nor customer) and trying to access a PRIVATE path
  // Note: Most storefront paths are public, private paths are mainly under /zangochap-manager
  if (!currentUser && pathname.startsWith("/zangochap-manager") && pathname !== "/zangochap-manager") {
    return NextResponse.redirect(new URL("/zangochap-manager", request.url));
  }

  // If staff ALREADY logged in and trying to access staff LOGIN page
  if (currentUser && pathname === "/zangochap-manager") {
    return NextResponse.redirect(new URL("/zangochap-manager/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
