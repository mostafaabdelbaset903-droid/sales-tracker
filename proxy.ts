import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isLoggedIn =
    request.cookies.get("sales_tracker_auth")?.value === "true";

  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)",
  ],
};
