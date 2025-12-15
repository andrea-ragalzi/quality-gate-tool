import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

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
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("LoadingModal", () => {
  it("should use BEM classes", () => {
    render(
      <MantineProvider>
        <LoadingModal
          opened={true}
          title="Loading Test"
          message="Please wait..."
        />
      </MantineProvider>,
    );

    const title = screen.getByText("Loading Test");
    expect(title.className).toContain("loading-modal__title");

    const message = screen.getByText("Please wait...");
    expect(message.className).toContain("loading-modal__message");
  });
});
