import type { ChatCompletionMessageParam } from "openai/resources";


class ConversationManager {
    private conversations: Map<string, ChatCompletionMessageParam[]> = new Map()
    private maxHistory = 20

    getHistory(chatId: string): ChatCompletionMessageParam[] {
        return this.conversations.get(chatId) || []
    }

    addMessage(chatId: string, message: ChatCompletionMessageParam) {
        const history = this.getHistory(chatId)
        history.push(message)

        if (history.length > this.maxHistory) {
            history.shift()
        }

        this.conversations.set(chatId, history)
    }

    setHistory(chatId: string, history: ChatCompletionMessageParam[]){
        this.conversations.set(chatId, history)
    }

    deleteHistory(chatId: string){
        this.conversations.delete(chatId)
    }
}

export const conversationManager = new ConversationManager()