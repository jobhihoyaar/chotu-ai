import type { ChatCompletionFunctionTool } from "openai/resources/chat/completions";
import { getWhatsAppChatsTool } from "./whatsapp-get-chats.tool.js";
import { sendWhatsAppMessageTool } from "./whatsapp-send-message.tool.js";

export interface ChotuTool {
  tool: ChatCompletionFunctionTool; 
  execute: (args: any) => Promise<any> | any;
}

export const allTools: Record<string, ChotuTool> = {
  [getWhatsAppChatsTool.tool.function.name]: getWhatsAppChatsTool,
  [sendWhatsAppMessageTool.tool.function.name]: sendWhatsAppMessageTool,
};

export const toolDeclarations = Object.values(allTools).map((t) => t.tool);