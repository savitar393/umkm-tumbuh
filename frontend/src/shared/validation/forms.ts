export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function onlyDigits(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

export function normalizeIndonesianPhone(value: string) {
  return value.replace(/^\+?62/, "").replace(/^0/, "").replace(/\D/g, "");
}

export function isValidIndonesianPhone(value: string) {
  const phone = normalizeIndonesianPhone(value);
  return phone.length >= 8 && phone.length <= 13;
}

export function isValidNIK(value: string) {
  return /^\d{16}$/.test(value);
}

export function required(value: string) {
  return value.trim().length > 0;
}

export function isStrongEnoughPassword(value: string) {
  return value.length >= 8;
}