import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";
import { chotu } from "../core/chotu-ai.js";
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
      const hasAccess = await checkAccess(this.bot, msg)
      if (msg.text?.startsWith("/") || !hasAccess) return;
      const chatId = msg.chat.id;
      const text = msg.text || "";

      try {
        await this.bot.sendChatAction(chatId, "typing");

        const aiResponse = await chotu.handleIncomingMessage(chatId.toString(), text);

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

    this.bot.on("voice", async (msg) => {
      const chatId = msg.chat.id;
      const fileId = msg.voice?.file_id;

      if (!fileId) return;

      try {
        await this.bot.sendChatAction(chatId, "typing");

        const fileStream = this.bot.getFileStream(fileId);

        const chunks: Buffer[] = [];
        for await (const chunk of fileStream) {
          chunks.push(Buffer.from(chunk));
        }
        const audioBuffer = Buffer.concat(chunks);

        // Pass the Buffer directly
        const aiResponse = await chotu.generateAudioResponse(audioBuffer);
        if (aiResponse) {
          await this.bot.sendMessage(chatId, aiResponse);
        }
      } catch (error) {
        console.error("[Telegram] Audio Processing Error:", error);
        await this.bot.sendMessage(
          chatId,
          "Bhai, ye voice note sunne mein thoda problem ho raha hai.",
        );
      }
    });
  }

  public start() {
    console.log("🤖 Telegram Service Started (node-telegram-bot-api)");
  }
}

export const telegramService = new TelegramService();
