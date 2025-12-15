import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";
import "@testing-library/jest-dom";
import { MantineProvider } from "@mantine/core";
import { MatrixIntro } from "@/widgets/matrix-intro";

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

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: "",
    fillRect: vi.fn(),
    font: "",
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
  })) as any;
});

vi.mock("three", () => {
  return {
    Scene: class {
      add = vi.fn();
      remove = vi.fn();
      children: any[] = [];
    },
    PerspectiveCamera: class {
      position = { z: 0 };
      updateProjectionMatrix = vi.fn();
      fov = 75;
      constructor(fov: number, aspect: number, near: number, far: number) {}
    },
    WebGLRenderer: class {
      domElement = document.createElement("canvas");
      setSize = vi.fn();
      setClearColor = vi.fn();
      render = vi.fn();
      dispose = vi.fn();
      constructor(options: any) {}
    },
    CanvasTexture: class {
      needsUpdate = false;
      clone = vi.fn(() => ({
        offset: { x: 0, y: 0 },
        repeat: { x: 0, y: 0 },
      }));
      constructor(canvas: any) {}
    },
    PlaneGeometry: class {
      constructor(width: number, height: number) {}
    },
    MeshBasicMaterial: class {
      map = {
        offset: { x: 0, y: 0 },
        repeat: { x: 0, y: 0 },
      };
      opacity = 1;
      constructor(options: any) {}
    },
    Mesh: class {
      position = { x: 0, y: 0, z: 0, add: vi.fn() };
      rotation = { x: 0, y: 0, z: 0 };
      scale = { setScalar: vi.fn() };
      material = { opacity: 1 };
      constructor(geometry: any, material: any) {}
    },
    Vector3: class {
      x = 0;
      y = 0;
      z = 0;
      constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
      clone() {
        return this;
      }
      multiplyScalar() {
        return this;
      }
      add() {
        return this;
      }
    },
    DoubleSide: "DoubleSide",
  };
});

describe("MatrixIntro Component", () => {
  const defaultProps = {
    phase: "matrix" as const,
    onGlitchStart: vi.fn(),
    onCrackStart: vi.fn(),
    onShatterStart: vi.fn(),
    onShatterComplete: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("renders without crashing", () => {
    render(
      <MantineProvider>
        <MatrixIntro {...defaultProps} />
      </MantineProvider>,
    );
    const container = document.querySelector(".matrix-intro__canvas-container");
    expect(container).toBeInTheDocument();
  });

  it("handles typing phase", () => {
    render(
      <MantineProvider>
        <MatrixIntro {...defaultProps} />
      </MantineProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(document.querySelector(".matrix-intro")).toBeInTheDocument();
  });

  it("handles skip button", () => {
    render(
      <MantineProvider>
        <MatrixIntro {...defaultProps} />
      </MantineProvider>,
    );
    const skipButton = screen.getByText("[ JUMP ]");
    fireEvent.click(skipButton);
    expect(defaultProps.onSkip).toHaveBeenCalled();
  });
});
