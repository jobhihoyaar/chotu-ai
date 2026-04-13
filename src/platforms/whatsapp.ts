import WebSocket from "ws";
import "dotenv/config";

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
    const WA_URL = process.env.WA_URL || "";
    const DEVICE_ID = process.env.WA_DEVICE_ID || "";
    const WA_USER = process.env.WA_USER || "";
    const WA_PASSWORD = process.env.WA_PASSWORD || "";

    this.deviceId = DEVICE_ID;

    // Convert HTTP URL to WS URL
    const baseUrl = WA_URL.replace(/^http/, "ws");
    this.wsUrl = `${baseUrl}/ws?device_id=${this.deviceId}`;

    // Build auth header
    const auth = Buffer.from(`${WA_USER}:${WA_PASSWORD}`).toString("base64");

    this.headers = {
      Authorization: `Basic ${auth}`,
      "X-Device-Id": this.deviceId,
    };
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

        this.sendSubscriptionFrames();

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
        this.handleMessage(data);
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

  private sendSubscriptionFrames() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Different gateways use different subscribe shapes; send a few safe variants.
    const frames = [
      { action: "subscribe", event: "message", device_id: this.deviceId },
      { action: "subscribe", events: ["message", "messages.upsert"], device_id: this.deviceId },
      { type: "subscribe", channel: "messages", device_id: this.deviceId },
      { event: "subscribe", payload: { events: ["message", "messages.upsert"], device_id: this.deviceId } },
    ];

    for (const frame of frames) {
      try {
        const raw = JSON.stringify(frame);
        this.ws.send(raw);
        console.log("[WhatsApp] -> sent subscribe frame:", raw);
      } catch (error) {
        console.error("[WhatsApp] Failed sending subscribe frame:", error);
      }
    }
  }

  private handleMessage(data: WebSocket.Data) {
    try {
      const rawData = data.toString();
      console.log("[WhatsApp] === MESSAGE RECEIVED ===");
      console.log("[WhatsApp] Raw data length:", rawData.length);
      console.log("[WhatsApp] Raw data:", rawData);

      // Try to parse as JSON
      let message: any;
      try {
        message = JSON.parse(rawData);
        console.log("[WhatsApp] ✅ Parsed as JSON");
        console.log("[WhatsApp] Message keys:", Object.keys(message));
        console.log("[WhatsApp] Message:", JSON.stringify(message, null, 2));
      } catch (parseError) {
        console.log("[WhatsApp] ❌ Failed to parse as JSON:", parseError);
        return;
      }

      // Log the event type
      const eventType = message.event || message.type || "UNKNOWN";
      console.log("[WhatsApp] Event type:", eventType);
      console.log("[WhatsApp] Device ID:", message.device_id || "N/A");

      // Try different payload structures
      let messageData = null;

      // Structure 1: New webhook format with payload wrapper
      if (message.payload) {
        console.log("[WhatsApp] Found payload field");
        if (message.payload.messages && Array.isArray(message.payload.messages)) {
          console.log(`[WhatsApp] Found ${message.payload.messages.length} messages in payload.messages`);
          messageData = message.payload.messages;
        } else if (message.payload.message) {
          console.log("[WhatsApp] Found single message in payload.message");
          messageData = [message.payload.message];
        }
      }

      // Structure 2: Direct messages array
      if (!messageData && message.messages && Array.isArray(message.messages)) {
        console.log(`[WhatsApp] Found ${message.messages.length} messages at root.messages`);
        messageData = message.messages;
      }

      // Structure 3: Single message at root
      if (!messageData && (message.body || message.text || message.pushName)) {
        console.log("[WhatsApp] Found message at root level");
        messageData = [message];
      }

      // Process found messages
      if (messageData && Array.isArray(messageData)) {
        console.log(`[WhatsApp] Processing ${messageData.length} message(s)`);
        for (const msg of messageData) {
          this.logIncomingMessage(msg);
        }
      } else {
        console.log("[WhatsApp] ⚠️ No message data found in expected locations");
        console.log("[WhatsApp] Full message structure for debugging:");
        console.log(JSON.stringify(message, null, 2));
      }

      console.log("[WhatsApp] === END MESSAGE ===\\n");
    } catch (error) {
      console.error("[WhatsApp] Error in handleMessage:", error);
    }
  }

  private logIncomingMessage(msg: any) {
    try {
      console.log("[WhatsApp] Processing message object, keys:", Object.keys(msg));

      const senderPhone =
        msg.senderJid?.replace("@s.whatsapp.net", "") ||
        msg.sender?.replace("@s.whatsapp.net", "") ||
        msg.from?.replace("@s.whatsapp.net", "") ||
        msg.pushName ||
        "unknown";

      const senderName = msg.senderName || msg.pushName || msg.from || senderPhone;

      const messageText =
        msg.body ||
        msg.text ||
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.conversation ||
        "";

      const preview = messageText.substring(0, 120);

      if (preview) {
        console.log(
          `[WhatsApp] ✅ Received message from=${senderName} (${senderPhone}) message="${preview}"`,
        );
      } else {
        console.log("[WhatsApp] Message found but no text content:", JSON.stringify(msg, null, 2).substring(0, 500));
      }
    } catch (error) {
      console.error("[WhatsApp] Error processing message:", error);
      console.log("[WhatsApp] Message object:", JSON.stringify(msg, null, 2).substring(0, 500));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WhatsApp] Max reconnect attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(
      `[WhatsApp] Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delayMs}ms...`,
    );

    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, delayMs);
  }
}

export const whatsAppService = new WhatsAppService();
