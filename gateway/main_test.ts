import { assertEquals } from "@std/assert";
import { scaffoldValue } from "./mod.ts";

Deno.test("scaffoldValue returns 1", () => {
  assertEquals(scaffoldValue(), 1);
});
