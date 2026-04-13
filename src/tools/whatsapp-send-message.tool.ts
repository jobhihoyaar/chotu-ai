import type { ChotuTool } from "./index.js";
import { sendMessageToWhatsapp } from "@/modules/whatsapp.js";
import { resolvePhoneNumber } from "@/constants/contacts.js";

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
    const contactNameOrPhone = String(args?.contactNameOrPhone || "").trim();
    const text = String(args?.text || "").trim();

    if (!contactNameOrPhone || !text) {
      throw new Error("contactNameOrPhone and text are required");
    }

    // Resolve the contact name to a phone number
    const phoneNumber = resolvePhoneNumber(contactNameOrPhone);

    
    const target = phoneNumber.includes("@s.whatsapp.net")
      ? phoneNumber
      : `${phoneNumber}@s.whatsapp.net`;

    const result = await sendMessageToWhatsapp(target, text);
    return { success: true, result };
  },
};