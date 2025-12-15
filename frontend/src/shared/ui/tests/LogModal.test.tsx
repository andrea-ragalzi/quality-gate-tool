import { render, screen, fireEvent } from "@testing-library/react";
import LogModal from "@/shared/ui/LogModal";
import { MantineProvider } from "@mantine/core";
import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

beforeAll(() => {
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

  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("LogModal Component", () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    title: "Test Logs",
    logContent: "Line 1\nLine 2\nLine 3",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  it("renders the copy button", () => {
    render(
      <MantineProvider>
        <LogModal {...defaultProps} />
      </MantineProvider>,
    );

    const copyButton = screen.getByRole("button", { name: /copy/i });
    expect(copyButton).toBeTruthy();
  });

  it("copies content to clipboard when copy button is clicked", async () => {
    render(
      <MantineProvider>
        <LogModal {...defaultProps} />
      </MantineProvider>,
    );

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      defaultProps.logContent,
    );
  });
});
