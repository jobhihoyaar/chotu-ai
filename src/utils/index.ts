import { ALLOWED_USERS, BLOCKED_MESSAGE } from "@/constants/index.js";
import TelegramBot, { type Message } from "node-telegram-bot-api";



export async function checkAccess(
  bot: TelegramBot,
  msg: Message,
): Promise<boolean> {
  try {
    const userId = msg.from?.id?.toString();
    console.log({userId})
    if (!userId || !ALLOWED_USERS.has(userId)) {
      await bot.sendMessage(msg.chat.id, BLOCKED_MESSAGE);
      return false;
    }

    return true; // ✅ Important
  } catch (error) {
    console.error("Access check error:", error);
    return false;
  }
}
