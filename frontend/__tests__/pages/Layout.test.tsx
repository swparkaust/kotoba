import { render, screen } from "@testing-library/react";
import RootLayout, { metadata, viewport } from "@/app/layout";

describe("RootLayout", () => {
  it("renders children within the layout", () => {
    render(
      <RootLayout>
        <div data-testid="child">Hello</div>
      </RootLayout>
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("exports metadata with title and description", () => {
    expect(metadata.title).toBe("Kotoba — Learn Japanese");
    expect(metadata.manifest).toBe("/manifest.json");
  });

  it("exports viewport with themeColor", () => {
    expect(viewport.themeColor).toBe("#E85D3A");
  });
});
