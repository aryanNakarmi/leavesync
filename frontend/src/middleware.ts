import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes — only ADMIN role allowed
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        const employeeUrl = new URL("/employee", req.url);
        return NextResponse.redirect(employeeUrl);
      }
    }

    // Employee routes — only EMPLOYEE role allowed
    if (path.startsWith("/employee")) {
      if (token?.role !== "EMPLOYEE") {
        const adminUrl = new URL("/admin", req.url);
        return NextResponse.redirect(adminUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // If there's no token at all, redirect to login
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes — always allow
        if (path === "/login" || path === "/signup" || path === "/") {
          return true;
        }

        // Protected routes — require a token
        if (path.startsWith("/admin") || path.startsWith("/employee")) {
          return !!token;
        }

        // Default: allow
        return true;
      },
    },
  }
);

// Only run middleware on these paths
export const config = {
  matcher: ["/admin/:path*", "/employee/:path*"],
};
