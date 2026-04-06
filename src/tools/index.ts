import type { ChatCompletionFunctionTool } from "openai/resources/chat/completions";

export interface ChotuTool {
  tool: ChatCompletionFunctionTool; 
  execute: (args: any) => Promise<any> | any;
}

export const allTools: Record<string, ChotuTool> = {};

export const toolDeclarations = Object.values(allTools).map((t) => t.tool);