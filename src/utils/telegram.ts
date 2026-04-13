import TelegramBot from "node-telegram-bot-api";
import { chotu } from "@/core/index.js";
import { checkAccess } from "@/utils/index.js";

function logIncomingTextMessage(msg: TelegramBot.Message) {
  const rawText = msg.text || "";
  const preview = rawText.length > 120 ? `${rawText.slice(0, 120)}...` : rawText;
  console.log(
    `[Telegram] Received message chatId=${msg.chat.id} userId=${msg.from?.id ?? "unknown"} text="${preview}"`,
  );
}

async function processTextMessage(
  bot: TelegramBot,
  chatId: number | string,
  text: string,
) {
  try {
    await bot.sendChatAction(chatId, "typing");

    const aiResponse = await chotu.handleMessage(chatId.toString(), text);

    if (aiResponse && aiResponse.trim().length > 0) {
      await bot.sendMessage(chatId, aiResponse);
    } else {
      console.log(
        "[Telegram] Gemini returned an empty response (likely during tool use).",
      );
    }
  } catch (error) {
    console.error("Text Processing Error:", error);
  }
}

export function createTelegramHandlers(bot: TelegramBot) {
  const handleStartCommand = (msg: TelegramBot.Message) => {
    bot.sendMessage(
      msg.chat.id,
      "Chotu AI is online. Ready for the long haul.",
    );
  };

  const handleTextMessage = async (msg: TelegramBot.Message) => {
    logIncomingTextMessage(msg);

    const hasAccess = await checkAccess(bot, msg);
    if (msg.text?.startsWith("/") || !hasAccess) return;

    const chatId = msg.chat.id;
    const text = msg.text || "";
    await processTextMessage(bot, chatId, text);
  };

  return {
    handleStartCommand,
    handleTextMessage,
  };
}
