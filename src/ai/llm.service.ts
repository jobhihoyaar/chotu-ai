import OpenAI from "openai";
import { toolDeclarations } from "@/tools/index.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class LLMService {
    private client: OpenAI;
    private model: string = "gpt-oss:120b";

    constructor() {
        this.client = new OpenAI({
            baseURL: "https://ollama.com/v1",
            apiKey: process.env.OLLAMA_API_KEY,
        })
    }

    async getCompletion(messages: ChatCompletionMessageParam[]){
        return await this.client.chat.completions.create({
            model: this.model,
            messages,
            tools: toolDeclarations,
            tool_choice: "auto"
        })
    }
}