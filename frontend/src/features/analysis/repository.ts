import { StartAnalysisPayload } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export class AnalysisRepository {
  private ws: WebSocket | null = null;
  private messageHandler: ((data: any) => void) | null = null;

  connect(
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: () => void,
  ) {
    if (this.ws) return;

    this.messageHandler = onMessage;
    this.ws = new WebSocket(`${WS_URL}/api/ws/analysis`);

    this.ws.onopen = () => {
      console.log("WebSocket Connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageHandler) {
          this.messageHandler(data);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket Disconnected");
      this.ws = null;
      if (onClose) onClose();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket Error", error);
      if (onError) onError(error);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async startAnalysis(payload: StartAnalysisPayload): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/run-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to start analysis: ${response.statusText}`);
    }
  }

  async stopAnalysis(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/stop-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to stop analysis: ${response.statusText}`);
    }
  }

  async stopWatch(): Promise<void> {
    // Send WS message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "STOP" }));
    }

    const response = await fetch(`${API_BASE_URL}/api/stop-watch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to stop watch: ${response.statusText}`);
    }
  }
}
