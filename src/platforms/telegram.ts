import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";
import { createTelegramHandlers } from "@/utils/telegram.js";

export class TelegramService {
  private bot: TelegramBot;
  private handlers: ReturnType<typeof createTelegramHandlers>;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is missing in .env file");
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.handlers = createTelegramHandlers(this.bot);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, this.handlers.handleStartCommand);
    this.bot.on("text", this.handlers.handleTextMessage);
  }

  public start() {
    console.log("🤖 Telegram Service Started (node-telegram-bot-api)");
  }
}

export const telegramService = new TelegramService();
