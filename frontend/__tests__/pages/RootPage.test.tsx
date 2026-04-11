import { redirect } from "next/navigation";
import RootPage from "@/app/page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("RootPage", () => {
  it("redirects to /dashboard", () => {
    RootPage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
