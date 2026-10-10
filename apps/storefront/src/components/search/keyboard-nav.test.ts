import { describe, expect, it } from "vitest";
import { moveActiveIndex, shouldOpenOnKey } from "./keyboard-nav";

describe("autocomplete keyboard navigation", () => {
  it("starts at the first option when moving down from no selection", () => {
    expect(moveActiveIndex(-1, "ArrowDown", 5)).toBe(0);
  });

  it("wraps around the list in both directions", () => {
    expect(moveActiveIndex(4, "ArrowDown", 5)).toBe(0);
    expect(moveActiveIndex(0, "ArrowUp", 5)).toBe(4);
    expect(moveActiveIndex(-1, "ArrowUp", 5)).toBe(4);
  });

  it("supports Home and End for an accessible listbox", () => {
    expect(moveActiveIndex(2, "Home", 5)).toBe(0);
    expect(moveActiveIndex(2, "End", 5)).toBe(4);
  });

  it("keeps selection stable on Enter and Escape", () => {
    expect(moveActiveIndex(2, "Enter", 5)).toBe(2);
    expect(moveActiveIndex(2, "Escape", 5)).toBe(2);
  });

  it("has no active option when the suggestion list is empty", () => {
    expect(moveActiveIndex(-1, "ArrowDown", 0)).toBe(-1);
    expect(moveActiveIndex(0, "Home", 0)).toBe(-1);
  });

  it("opens the listbox on arrow keys only when there is text", () => {
    expect(shouldOpenOnKey("ArrowDown", true)).toBe(true);
    expect(shouldOpenOnKey("ArrowUp", true)).toBe(true);
    expect(shouldOpenOnKey("ArrowDown", false)).toBe(false);
    expect(shouldOpenOnKey("Enter", true)).toBe(false);
  });
});
