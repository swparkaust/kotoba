import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const backendUrl = process.env.RAILS_API_URL || "http://localhost:3001";
  const url = new URL(request.nextUrl.pathname + request.nextUrl.search, backendUrl);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/api/v1/:path*",
};
