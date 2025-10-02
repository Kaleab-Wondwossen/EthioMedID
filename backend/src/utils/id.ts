export function makePatientId(): string {
  const y = new Date().getFullYear().toString().slice(-2); // e.g. "25"
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `P-${y}${rand}`; // e.g., P-25AB12CD
}
