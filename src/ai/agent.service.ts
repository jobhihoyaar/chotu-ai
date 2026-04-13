import { allTools } from "@/tools/index.js";
import type { ConversationManager } from "@/ai/conversation.service.js";
import type { LLMService } from "@/ai/llm.service.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class AgentService {
    private systemInstruction = "You are a assistant model who can call tools natively";

    constructor(
        private llm: LLMService,
        private memory: ConversationManager
    ) { }

    async handleMessage(chatId: string, text: string): Promise<string> {
        const preview = text.length > 120 ? `${text.slice(0, 120)}...` : text;
        console.log(`[Agent] Received message chatId=${chatId} text="${preview}"`);

        this.memory.addMessage(chatId, {
            role: "user",
            content: text
        })

        try {
            const history = this.memory.getHistory(chatId);
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: this.systemInstruction },
                ...history
            ];

            let response = await this.llm.getCompletion(messages);
            let assistantMessage = response.choices[0]?.message;


            while (assistantMessage?.tool_calls) {
                this.memory.addMessage(chatId, assistantMessage);
                messages.push(assistantMessage);

                for(const call of assistantMessage.tool_calls){
                    if(call.type !== "function") continue

                    const tool = allTools[call.function.name];
                    if(!tool) continue;

                    let args: Record<string, unknown> = {};
                    try {
                        args = JSON.parse(call.function.arguments || "{}");
                    } catch {
                        args = {};
                    }

                    const result = await tool.execute(args);

                    const toolMessage: ChatCompletionMessageParam = {
                        role: "tool",
                        tool_call_id: call.id,
                        content: JSON.stringify(result)
                    }

                    this.memory.addMessage(chatId, toolMessage);
                    messages.push(toolMessage);
                }

                response = await this.llm.getCompletion(messages);
                assistantMessage = response.choices[0]?.message;
            }

            const finalContent = assistantMessage?.content || "";
            this.memory.addMessage(chatId, {
                role: "assistant",
                content: finalContent
            });

            return finalContent;
        } catch (error) {
            console.error("Agent Error:", error);
            return "Something went wrong!";
        }
    }
}