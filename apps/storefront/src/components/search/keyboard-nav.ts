export type ListboxKey =
  | "ArrowDown"
  | "ArrowUp"
  | "Home"
  | "End"
  | "Enter"
  | "Escape";

export function moveActiveIndex(
  current: number,
  key: ListboxKey,
  count: number,
): number {
  if (count <= 0) return -1;
  switch (key) {
    case "ArrowDown":
      return current < 0 ? 0 : (current + 1) % count;
    case "ArrowUp":
      return current < 0 ? count - 1 : (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return current;
  }
}

export function shouldOpenOnKey(key: string, hasText: boolean): boolean {
  return (key === "ArrowDown" || key === "ArrowUp") && hasText;
}
