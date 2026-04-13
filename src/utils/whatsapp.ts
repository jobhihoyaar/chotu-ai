import { resolvePhoneNumber } from "@/constants/contacts.js";

export type SendWhatsAppMessageArgs = {
	contactNameOrPhone?: unknown;
	text?: unknown;
};

export function getSendWhatsAppMessagePayload(args: SendWhatsAppMessageArgs) {
	const contactNameOrPhone = String(args?.contactNameOrPhone || "").trim();
	const text = String(args?.text || "").trim();

	if (!contactNameOrPhone || !text) {
		throw new Error("contactNameOrPhone and text are required");
	}

	const phoneNumber = resolvePhoneNumber(contactNameOrPhone);
	const target = phoneNumber.includes("@s.whatsapp.net")
		? phoneNumber
		: `${phoneNumber}@s.whatsapp.net`;

	return { target, text };
}
