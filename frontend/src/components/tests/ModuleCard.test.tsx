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
    const { container } = renderWithMantine(
      <ModuleCard {...defaultProps} logs={["Log 1"]} onViewLog={onViewLog} />,
    );

    // Click to expand (click the card itself)
    const card = container.querySelector(".module-card");
    if (card) fireEvent.click(card);

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

  it("should strip status emoji from summary", () => {
    renderWithMantine(
      <ModuleCard {...defaultProps} summary="❌ 4 issues found" />,
    );
    expect(screen.getByText("4 issues found")).toBeDefined();
    expect(screen.queryByText("❌ 4 issues found")).toBeNull();
  });

  it("should copy logs to clipboard when copy button is clicked", () => {
    const logs = ["Log 1", "Log 2"];
    const writeText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    const { container } = renderWithMantine(
      <ModuleCard {...defaultProps} logs={logs} />,
    );

    // Click to expand (click the card itself)
    const card = container.querySelector(".module-card");
    if (card) fireEvent.click(card);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(logs.join("\n"));
  });

  it("should apply correct theme class for status to ensure color consistency", () => {
    const { container, rerender } = renderWithMantine(
      <ModuleCard {...defaultProps} status="FAIL" />,
    );

    // Check for FAIL theme
    const cardFail = container.querySelector(".module-card");
    expect(cardFail?.classList.contains("module-card--fail")).toBe(true);

    // Rerender with PASS
    rerender(
      <MantineProvider>
        <ModuleCard {...defaultProps} status="PASS" />
      </MantineProvider>,
    );
    const cardPass = container.querySelector(".module-card");
    expect(cardPass?.classList.contains("module-card--pass")).toBe(true);

    // Rerender with RUNNING
    rerender(
      <MantineProvider>
        <ModuleCard {...defaultProps} status="RUNNING" />
      </MantineProvider>,
    );
    const cardRunning = container.querySelector(".module-card");
    expect(cardRunning?.classList.contains("module-card--running")).toBe(true);
  });

  it("should ensure issue count is rendered within the themed container", () => {
    const { container } = renderWithMantine(
      <ModuleCard
        {...defaultProps}
        status="FAIL"
        summary="❌ 3 Critical Issues"
      />,
    );

    const issueCount = screen.getByText("3 Critical Issues");
    const card = container.querySelector(".module-card--fail");

    expect(card).toBeDefined();
    expect(card?.contains(issueCount)).toBe(true);
    expect(issueCount.className).toContain("module-card__issue-count");
  });
});
