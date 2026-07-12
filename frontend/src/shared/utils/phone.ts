function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function getPhoneLocalValue(value: string) {
  let digits = onlyDigits(value);

  while (digits.startsWith("62")) {
    digits = digits.slice(2);
  }

  digits = digits.replace(/^0+/, "");

  return digits;
}

export function buildPhoneWithIndonesiaPrefix(value: string) {
  const local = getPhoneLocalValue(value);

  if (!local) return "";

  return `62${local}`;
}

export function isValidIndonesianPhone(value: string) {
  const normalized = buildPhoneWithIndonesiaPrefix(value);

  return /^62[1-9]\d{8,12}$/.test(normalized);
}

export function formatIndonesianPhone(value?: string | null) {
  const normalized = buildPhoneWithIndonesiaPrefix(value ?? "");

  if (!normalized) return "Nomor WhatsApp belum diisi";

  return `+62 ${normalized.slice(2)}`;
}
