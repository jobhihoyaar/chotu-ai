import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";
import { chotu } from "@/core/index.js";
import { checkAccess } from "@/utils/index.js";

export class TelegramService {
  private bot: TelegramBot;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is missing in .env file");
    }

    // Initialize with polling: true to start receiving messages immediately
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      this.bot.sendMessage(
        msg.chat.id,
        "Chotu AI is online. Ready for the long haul.",
      );
    });

    // Handle Text Messages
    this.bot.on("text", async (msg) => {
      const rawText = msg.text || "";
      const preview = rawText.length > 120 ? `${rawText.slice(0, 120)}...` : rawText;
      console.log(
        `[Telegram] Received message chatId=${msg.chat.id} userId=${msg.from?.id ?? "unknown"} text="${preview}"`,
      );

      const hasAccess = await checkAccess(this.bot, msg)
      if (msg.text?.startsWith("/") || !hasAccess) return;
      const chatId = msg.chat.id;
      const text = msg.text || "";

      try {
        await this.bot.sendChatAction(chatId, "typing");

        const aiResponse = await chotu.handleMessage(chatId.toString(), text);

        if (aiResponse && aiResponse.trim().length > 0) {
          await this.bot.sendMessage(chatId, aiResponse);
        } else {
          console.log(
            "[Telegram] Gemini returned an empty response (likely during tool use).",
          );
        }
      } catch (error) {
        console.error("Text Processing Error:", error);
      }
    });
  }

  public start() {
    console.log("🤖 Telegram Service Started (node-telegram-bot-api)");
  }
}

export const telegramService = new TelegramService();
