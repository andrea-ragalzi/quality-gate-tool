import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import ModuleCard from "../ModuleCard";
import LoadingModal from "../LoadingModal";

// Mock ResizeObserver for Mantine
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for Mantine
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("Style Consistency (BEM)", () => {
  it("ModuleCard should use BEM classes", () => {
    render(
      <MantineProvider>
        <ModuleCard
          moduleId="test-mod"
          title="Test Module"
          icon="code"
          status="PASS"
          logs={[]}
          onViewLog={() => {}}
        />
      </MantineProvider>,
    );

    const card = screen.getByText("Test Module").closest(".module-card");
    expect(card).toBeDefined();
    expect(card?.className).toContain("module-card--pass");

    const content = card?.querySelector(".module-card__content");
    expect(content).toBeDefined();
  });

  it("LoadingModal should use BEM classes", () => {
    render(
      <MantineProvider>
        <LoadingModal
          opened={true}
          title="Loading Test"
          message="Please wait..."
        />
      </MantineProvider>,
    );

    // Mantine modals render in a portal, so we look for the text directly
    const title = screen.getByText("Loading Test");
    expect(title.className).toContain("loading-modal__title");

    const message = screen.getByText("Please wait...");
    expect(message.className).toContain("loading-modal__message");
  });
});
