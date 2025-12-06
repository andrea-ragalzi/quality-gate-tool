import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnalysisRepository } from "./repository";

describe("AnalysisRepository (Integration)", () => {
  let repository: AnalysisRepository;
  let mockWebSocket: any;

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
    };

    // Use a class to mock the constructor
    class MockWebSocket {
      constructor(url: string) {
        return mockWebSocket;
      }
    }

    global.WebSocket = MockWebSocket as any;
    repository = new AnalysisRepository();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should connect to WebSocket", () => {
    const onMessage = vi.fn();
    repository.connect(onMessage);

    // expect(global.WebSocket).toHaveBeenCalledWith(expect.stringContaining('/api/ws/analysis'));
    expect(repository["ws"]).toBe(mockWebSocket);
  });

  it("should handle incoming messages", () => {
    const onMessage = vi.fn();
    repository.connect(onMessage);

    // Simulate open
    if (mockWebSocket.onopen) mockWebSocket.onopen();

    // Simulate message
    const testData = { type: "LOG", message: "test log" };
    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({ data: JSON.stringify(testData) });
    }

    expect(onMessage).toHaveBeenCalledWith(testData);
  });

  it("should handle parsing errors (Parsing Bug Prevention)", () => {
    const onMessage = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    repository.connect(onMessage);

    if (mockWebSocket.onopen) mockWebSocket.onopen();

    // Simulate malformed JSON
    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage({ data: "INVALID JSON" });
    }

    // Should not crash and should log error
    expect(consoleSpy).toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should handle connection errors", () => {
    const onError = vi.fn();
    repository.connect(vi.fn(), onError);

    const errorEvent = new Event("error");
    if (mockWebSocket.onerror) {
      mockWebSocket.onerror(errorEvent);
    }

    expect(onError).toHaveBeenCalledWith(errorEvent);
  });

  it("should handle disconnection", () => {
    const onClose = vi.fn();
    repository.connect(vi.fn(), undefined, onClose);

    if (mockWebSocket.onclose) {
      mockWebSocket.onclose();
    }

    expect(onClose).toHaveBeenCalled();
  });
});
