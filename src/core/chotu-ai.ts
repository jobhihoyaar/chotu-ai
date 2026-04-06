import "dotenv/config";
import { AgentService } from "@/ai/agent.service.js";
import { ConversationManager } from "@/ai/conversation.service.js";
import { LLMService } from "@/ai/llm.service.js";

export class ChotuAI {
  private readonly agent: AgentService;

  constructor() {
    const llm = new LLMService();
    const memory = new ConversationManager();
    this.agent = new AgentService(llm, memory);
  }

  async handleMessage(chatId: string, text: string): Promise<string> {
    return this.agent.handleMessage(chatId, text);
  }

  // Backward-compatible alias for older platform adapters.
  async handleIncomingMessage(chatId: string, text: string): Promise<string> {
    return this.handleMessage(chatId, text);
  }
}

export const chotu = new ChotuAI();
