import { proxy, config } from "@/proxy";

jest.mock("next/server", () => ({
  NextResponse: {
    rewrite: jest.fn((url: URL) => ({ url: url.toString() })),
  },
}));

describe("proxy", () => {
  it("rewrites API requests to the backend", () => {
    const { NextResponse } = require("next/server");
    const request = {
      nextUrl: {
        pathname: "/api/v1/curriculum",
        search: "?language_code=ja",
      },
    };

    proxy(request as any);

    expect(NextResponse.rewrite).toHaveBeenCalledWith(
      new URL("http://localhost:3001/api/v1/curriculum?language_code=ja")
    );
  });

  it("uses RAILS_API_URL when set", () => {
    const original = process.env.RAILS_API_URL;
    process.env.RAILS_API_URL = "http://backend:3001";
    const { NextResponse } = require("next/server");

    const request = {
      nextUrl: { pathname: "/api/v1/reviews", search: "" },
    };

    proxy(request as any);

    expect(NextResponse.rewrite).toHaveBeenCalledWith(
      new URL("http://backend:3001/api/v1/reviews")
    );
    process.env.RAILS_API_URL = original;
  });

  it("exports config with API matcher", () => {
    expect(config.matcher).toBe("/api/v1/:path*");
  });
});
