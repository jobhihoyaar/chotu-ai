import type { ChotuTool } from "./index.js";
import { getChats } from "@/modules/whatsapp.js";

export const getWhatsAppChatsTool: ChotuTool = {
  tool: {
    type: "function",
    function: {
      name: "getWhatsAppChats",
      description: "Gets all WhatsApp chats from the connected WhatsApp gateway.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  execute: async () => {
    const chats = await getChats();
    return { chats };
  },
};