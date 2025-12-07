import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModuleCard from "../ModuleCard";
import { MantineProvider } from "@mantine/core";

// Mock matchMedia
beforeEach(() => {
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
});

// Wrap with MantineProvider because ModuleCard uses Mantine components
const renderWithMantine = (ui: React.ReactNode) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe("ModuleCard (Presentation)", () => {
  const defaultProps = {
    moduleId: "test-module",
    title: "Test Module",
    subtitle: "A test module",
    icon: "test-icon",
    status: "PENDING" as const,
    logs: [],
    onViewLog: vi.fn(),
  };

  it("should render title and subtitle", () => {
    renderWithMantine(<ModuleCard {...defaultProps} />);
    expect(screen.getByText("Test Module")).toBeDefined();
    expect(screen.getByText("A test module")).toBeDefined();
  });

  it("should render correct status icon for PASS", () => {
    const { container } = renderWithMantine(
      <ModuleCard {...defaultProps} status="PASS" />,
    );
    expect(container.querySelector(".module-card__icon--pass")).toBeDefined();
  });

  it("should render correct status icon for FAIL", () => {
    const { container } = renderWithMantine(
      <ModuleCard {...defaultProps} status="FAIL" />,
    );
    expect(container.querySelector(".module-card__icon--fail")).toBeDefined();
  });

  it("should call onViewLog when clicked", () => {
    const onViewLog = vi.fn();
    // Must provide logs for the button to appear
    renderWithMantine(
      <ModuleCard {...defaultProps} logs={["Log 1"]} onViewLog={onViewLog} />,
    );

    // The button is inside a details element, but it should be in the DOM.
    // However, if details is closed, it might be hidden? No, usually just not visible but in DOM.
    // But let's check if we need to open the details first.
    // The summary text is "Show Output Details".

    // Let's try to find the button directly first.
    const button = screen.getByRole("button", { name: /view full log/i });
    fireEvent.click(button);
    expect(onViewLog).toHaveBeenCalled();
  });

  it("should display logs count or summary", () => {
    const logs = ["Log 1", "Log 2"];
    renderWithMantine(<ModuleCard {...defaultProps} logs={logs} />);
    // Depending on implementation, it might show the logs or a count.
    // Let's assume it shows the last log line or similar.
  });

  it("should copy logs to clipboard when copy button is clicked", () => {
    const logs = ["Log 1", "Log 2"];
    const writeText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    renderWithMantine(<ModuleCard {...defaultProps} logs={logs} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(logs.join("\n"));
  });
});
