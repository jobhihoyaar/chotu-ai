import WebSocket from "ws";

export type WhatsAppConnectionConfig = {
  wsUrl: string;
  headers: Record<string, string>;
  deviceId: string;
};

export function createWhatsAppConnectionConfig(): WhatsAppConnectionConfig {
  const waUrl = process.env.WA_URL || "";
  const deviceId = process.env.WA_DEVICE_ID || "";
  const waUser = process.env.WA_USER || "";
  const waPassword = process.env.WA_PASSWORD || "";

  const baseUrl = waUrl.replace(/^http/, "ws");
  const wsUrl = `${baseUrl}/ws?device_id=${deviceId}`;
  const auth = Buffer.from(`${waUser}:${waPassword}`).toString("base64");

  const headers = {
    Authorization: `Basic ${auth}`,
    "X-Device-Id": deviceId,
  };

  return { wsUrl, headers, deviceId };
}

export function sendWhatsAppSubscriptionFrames(
  ws: WebSocket,
  deviceId: string,
) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const frames = [
    { action: "subscribe", event: "message", device_id: deviceId },
    { action: "subscribe", events: ["message", "messages.upsert"], device_id: deviceId },
    { type: "subscribe", channel: "messages", device_id: deviceId },
    { event: "subscribe", payload: { events: ["message", "messages.upsert"], device_id: deviceId } },
  ];

  for (const frame of frames) {
    try {
      const raw = JSON.stringify(frame);
      ws.send(raw);
      console.log("[WhatsApp] -> sent subscribe frame:", raw);
    } catch (error) {
      console.error("[WhatsApp] Failed sending subscribe frame:", error);
    }
  }
}

export function handleWhatsAppGatewayMessage(data: WebSocket.Data) {
  try {
    const rawData = data.toString();
    console.log("[WhatsApp] === MESSAGE RECEIVED ===");
    console.log("[WhatsApp] Raw data length:", rawData.length);
    console.log("[WhatsApp] Raw data:", rawData);

    let message: any;
    try {
      message = JSON.parse(rawData);
      console.log("[WhatsApp] Parsed as JSON");
      console.log("[WhatsApp] Message keys:", Object.keys(message));
      console.log("[WhatsApp] Message:", JSON.stringify(message, null, 2));
    } catch (parseError) {
      console.log("[WhatsApp] Failed to parse as JSON:", parseError);
      return;
    }

    const eventType = message.event || message.type || "UNKNOWN";
    console.log("[WhatsApp] Event type:", eventType);
    console.log("[WhatsApp] Device ID:", message.device_id || "N/A");

    let messageData = null;

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

    if (!messageData && message.messages && Array.isArray(message.messages)) {
      console.log(`[WhatsApp] Found ${message.messages.length} messages at root.messages`);
      messageData = message.messages;
    }

    if (!messageData && (message.body || message.text || message.pushName)) {
      console.log("[WhatsApp] Found message at root level");
      messageData = [message];
    }

    if (messageData && Array.isArray(messageData)) {
      console.log(`[WhatsApp] Processing ${messageData.length} message(s)`);
      for (const msg of messageData) {
        logIncomingWhatsAppMessage(msg);
      }
    } else {
      console.log("[WhatsApp] No message data found in expected locations");
      console.log("[WhatsApp] Full message structure for debugging:");
      console.log(JSON.stringify(message, null, 2));
    }

    console.log("[WhatsApp] === END MESSAGE ===\\n");
  } catch (error) {
    console.error("[WhatsApp] Error in handleMessage:", error);
  }
}

function logIncomingWhatsAppMessage(msg: any) {
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
        `[WhatsApp] Received message from=${senderName} (${senderPhone}) message="${preview}"`,
      );
    } else {
      console.log("[WhatsApp] Message found but no text content:", JSON.stringify(msg, null, 2).substring(0, 500));
    }
  } catch (error) {
    console.error("[WhatsApp] Error processing message:", error);
    console.log("[WhatsApp] Message object:", JSON.stringify(msg, null, 2).substring(0, 500));
  }
}

export function getReconnectDelayMs(reconnectAttempts: number): number {
  return Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
}
