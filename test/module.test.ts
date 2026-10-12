import { expect, test } from "bun:test"
import plugin from "../src/tui.tsx"

// Mirrors OpenCode v2's runtime guard for an external TUI plugin module.
test("default export is a valid V2 TUI plugin module", () => {
  expect(typeof plugin.id).toBe("string")
  expect(plugin.id.length).toBeGreaterThan(0)
  expect(typeof plugin.setup).toBe("function")
})
