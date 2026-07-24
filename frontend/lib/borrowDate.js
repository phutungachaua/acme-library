const pad = (value) => String(value).padStart(2, "0");
const toInputDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function dateAfter(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

export const defaultReturnDate = () => dateAfter(3);
export const minimumReturnDate = () => dateAfter(1);
export const maximumReturnDate = () => dateAfter(90);
