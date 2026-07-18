import { describe, it, expect } from "vitest";
import { scaffoldValue } from "./index";

describe("scaffold", () => {
  it("returns 1", () => {
    expect(scaffoldValue()).toBe(1);
  });
});
