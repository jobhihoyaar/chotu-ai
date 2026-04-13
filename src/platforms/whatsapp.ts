import WebSocket from "ws";
import "dotenv/config";
import {
  createWhatsAppConnectionConfig,
  getReconnectDelayMs,
  handleWhatsAppGatewayMessage,
  sendWhatsAppSubscriptionFrames,
} from "@/utils/whatsapp-platform.js";

export class WhatsAppService {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private readonly wsUrl: string;
  private readonly headers: Record<string, string>;
  private readonly deviceId: string;

  constructor() {
    const config = createWhatsAppConnectionConfig();
    this.deviceId = config.deviceId;
    this.wsUrl = config.wsUrl;
    this.headers = config.headers;
  }

  public async start() {
    console.log("📱 WhatsApp Service Started (WebSocket listener)");
    this.connect();
  }

  public stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    console.log("📱 WhatsApp Service Stopped");
  }

  private connect() {
    try {
      console.log("[WhatsApp] Attempting WebSocket connection to:", this.wsUrl);
      this.ws = new WebSocket(this.wsUrl, {
        headers: this.headers,
      });

      this.ws.on("open", () => {
        console.log("[WhatsApp] ✅ WebSocket connected successfully");
        console.log(`[WhatsApp] Connected for device_id=${this.deviceId}`);
        this.reconnectAttempts = 0;

        sendWhatsAppSubscriptionFrames(this.ws as WebSocket, this.deviceId);

        this.heartbeatInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.ping();
          }
        }, 25000);
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        console.log("[WhatsApp] 📨 WebSocket message received:");
        const rawData = data.toString();
        console.log("[WhatsApp] Raw data:", rawData);
        handleWhatsAppGatewayMessage(data);
      });

      this.ws.on("ping", () => {
        console.log("[WhatsApp] 🏓 Ping received from server");
      });

      this.ws.on("pong", () => {
        console.log("[WhatsApp] 🏓 Pong sent to server");
      });

      this.ws.on("error", (error: Error) => {
        console.error("[WhatsApp] ❌ WebSocket error:", error.message);
        console.error("[WhatsApp] Error stack:", error.stack);
      });

      this.ws.on("close", (code: number, reason: Buffer) => {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }

        console.log(`[WhatsApp] 🔌 WebSocket closed. Code: ${code}, Reason: ${reason.toString()}`);
        this.attemptReconnect();
      });

      this.ws.on("unexpected-response", (_req, res: any) => {
        console.error("[WhatsApp] ❌ Unexpected server response:", res.statusCode);
        console.error("[WhatsApp] Response headers:", res.headers);
      });
    } catch (error) {
      console.error("[WhatsApp] ❌ Failed to create WebSocket:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WhatsApp] Max reconnect attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    const delayMs = getReconnectDelayMs(this.reconnectAttempts);

    console.log(
      `[WhatsApp] Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delayMs}ms...`,
    );

    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, delayMs);
  }
}

export const whatsAppService = new WhatsAppService();
