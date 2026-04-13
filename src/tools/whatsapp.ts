import type { ChotuTool } from "@/tools/index.js";
import { getSendWhatsAppMessagePayload } from "@/utils/whatsapp.js";

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
		throw new Error("WhatsApp integration is disabled for now. Rebuild WhatsApp module to enable this tool.");
	},
};

export const sendWhatsAppMessageTool: ChotuTool = {
	tool: {
		type: "function",
		function: {
			name: "sendWhatsAppMessage",
			description: "Sends a WhatsApp message to a contact by name or phone number.",
			parameters: {
				type: "object",
				properties: {
					contactNameOrPhone: {
						type: "string",
						description: "Contact name or phone number (e.g., 'Satish Babny' or '+918454925804').",
					},
					text: {
						type: "string",
						description: "Message text to send.",
					},
				},
				required: ["contactNameOrPhone", "text"],
			},
		},
	},
	execute: async (args) => {
		getSendWhatsAppMessagePayload(args ?? {});
		throw new Error("WhatsApp integration is disabled for now. Rebuild WhatsApp module to enable this tool.");
	},
};
