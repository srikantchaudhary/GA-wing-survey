export function formatDateDdMmYyyy(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const plain = value.split("T")[0];
    const parts = plain.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
    }
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
