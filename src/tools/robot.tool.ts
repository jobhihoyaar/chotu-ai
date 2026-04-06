
import { pressSpaceBar } from "@/modules/robot.js";
import type { ChotuTool } from "./index.js";

export const robotTool: ChotuTool = {
  tool: {
    type: "function",
    function: {
      name: "pressSpaceBar",
      description: "Presses the spacebar key.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      },
    },
  },
  execute: async (args) => {
    pressSpaceBar()
    return { success: true };
  },
};