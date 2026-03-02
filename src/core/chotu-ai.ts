import { allTools, toolDeclarations } from "@/tools/index.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import OpenAI, { toFile } from "openai";
import "dotenv/config";

export class OpenRouterService {
  private client: OpenAI;
  // private model: string = "gemma3:4b-cloud";
  private model: string = "gpt-oss:120b";
  private systemInstruction: string;

  constructor() {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) {
      throw new Error("OLLAMA_API_KEY is missing in .env file");
    }

    this.systemInstruction =
      "You are a assistant model who can call tools natively";

    this.client = new OpenAI({
      baseURL: "https://ollama.com/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000", // Optional: Your site URL
        "X-Title": "Chotu AI", // Optional: Your site name
      },
    });
  }

  async generateResponse(prompt: string, history: any[] = []): Promise<string> {
    console.log(`[OpenRouter] Received Prompt: "${prompt}"`);

    try {
      // Build the message array (OpenRouter/OpenAI style)
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemInstruction },
        ...history,
        { role: "user", content: prompt },
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: toolDeclarations,
      });

      const assistantMessage = response.choices?.[0]?.message;

      if (!assistantMessage) {
        throw new Error("No message received from OpenRouter");
      }
      console.log({ assistantMessage });
      if (assistantMessage.tool_calls) {
        // Push the assistant message to history (must include tool_calls)
        messages.push(assistantMessage);

        for (const call of assistantMessage.tool_calls) {
          // 1. Narrow the type here
          if (call.type !== "function") continue;

          // Now call.function is guaranteed to exist!
          const tool = allTools[call.function.name];

          if (tool) {
            console.log(`[Tool] Executing: ${call.function.name}`);
            const args = JSON.parse(call.function.arguments);

            try {
              const observation = await tool.execute(args);
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify(observation),
              });
            } catch (error) {
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify({ error: "Tool failed" }),
              });
            }
          }
        }

        // 2. Final call to get the AI's natural language response
        const finalResult = await this.client.chat.completions.create({
          model: this.model,
          messages: messages,
        });

        return finalResult.choices[0]?.message?.content || "";
      }

      return assistantMessage.content || "";
    } catch (error: any) {
      console.error("!!! OpenRouter Service Error !!!", error);
      return "Arre yaar, dimag kaam nahi kar raha. Check API key or network!";
    }
  }

  async generateAudioResponse(audioBuffer: Buffer, history: any[] = []) {
  try {
    // 1. Transcribe the audio first (Example using OpenAI/OpenRouter Whisper)
    // Telegram audio is OGG, so we send it as a file
    const transcription = await this.client.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'voice.ogg'), 
      model: "whisper-1",
    });

    const userText = transcription.text;
    console.log(`[Whisper] Transcribed: "${userText}"`);

    // 2. Now send the TRANSCRIBED TEXT to your big model
    return await this.generateResponse(userText, history);

  } catch (error) {
    console.error("Transcription failed", error);
    return "Bhai, awaz samajh nahi aayi. Dubara bolna?";
  }
}

  async generateAudioResponseOld(audioBase64: string, history: any[] = []) {
    console.log(`[OpenRouter] Processing audio request...`);

    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemInstruction },
        ...history,
        {
          type: "input_audio",
          input_audio: {
            data: audioBase64,
            format: "wav", // Telegram voice notes are usually OGG/OPUS, but many APIs expect WAV or MP3
          },
        },
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        tools: toolDeclarations,
      });

      const assistantMessage = response.choices?.[0]?.message;

      if (!assistantMessage) throw new Error("No response");

      if (assistantMessage.tool_calls) {
        // Push the assistant message to history (must include tool_calls)
        messages.push(assistantMessage);

        for (const call of assistantMessage.tool_calls) {
          // 1. Narrow the type here
          if (call.type !== "function") continue;

          // Now call.function is guaranteed to exist!
          const tool = allTools[call.function.name];

          if (tool) {
            console.log(`[Tool] Executing: ${call.function.name}`);
            const args = JSON.parse(call.function.arguments);

            try {
              const observation = await tool.execute(args);
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify(observation),
              });
            } catch (error) {
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify({ error: "Tool failed" }),
              });
            }
          }
        }

        // 2. Final call to get the AI's natural language response
        const finalResult = await this.client.chat.completions.create({
          model: this.model,
          messages: messages,
        });

        return finalResult.choices[0]?.message?.content || "";
      }

      return (
        assistantMessage.content || "Suna toh maine, par kuch samajh nahi aaya."
      );
    } catch (error) {
      console.error("!!! Audio Processing Error !!!", error);
      return "Microphone mein kuch gadbad hai lagta hai!";
    }
  }
}

export const chotu = new OpenRouterService();
