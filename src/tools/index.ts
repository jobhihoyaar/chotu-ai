import type { ChatCompletionFunctionTool } from "openai/resources/chat/completions";
import { robotTool } from "./robot.js";

export interface ChotuTool {
  tool: ChatCompletionFunctionTool; 
  execute: (args: any) => Promise<any> | any;
}

export const allTools: Record<string, ChotuTool> = {
  [robotTool.tool.function.name]: robotTool
};

export const toolDeclarations = Object.values(allTools).map((t) => t.tool);