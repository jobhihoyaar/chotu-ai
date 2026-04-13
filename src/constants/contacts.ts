export interface Contact {
  name: string;
  phoneNumber: string;
}

export const contacts: Record<string, string> = {
  "Satish Babny": "+918454925804",
  "Satish": "+918454925804",
  "Babny": "+918454925804",
  "Rishu Babu": "+919785257062",
  "Rishu": "+919785257062",
  "Babu": "+919785257062",
};

/**
 * Look up a contact by name or return the phone number as-is if it looks like a phone number.
 */
export function resolvePhoneNumber(nameOrPhone: string): string {
  const normalized = nameOrPhone.trim();

  // Check if it's in the contacts registry
  if (contacts[normalized]) {
    return contacts[normalized];
  }

  // Check case-insensitive match
  for (const [name, phone] of Object.entries(contacts)) {
    if (name.toLowerCase() === normalized.toLowerCase()) {
      return phone;
    }
  }

  // If it looks like a phone number, return as-is
  if (/^\+?[\d\s\-()]+$/.test(normalized)) {
    return normalized;
  }

  throw new Error(
    `Contact not found: "${normalized}". Please use a registered contact name or a valid phone number.`,
  );
}
