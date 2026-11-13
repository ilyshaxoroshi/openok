import { describe, expect, test } from "bun:test"
import { isNewer } from "./release"

describe("updater release", () => {
  test("compares major.minor.patch versions", () => {
    expect(isNewer("2.2.6", "2.2.5")).toBe(true)
    expect(isNewer("v2.2.6", "2.2.5")).toBe(true)
    expect(isNewer("2.10.0", "2.9.9")).toBe(true)
    expect(isNewer("3.0.0", "2.99.99")).toBe(true)
    expect(isNewer("2.2.5", "2.2.5")).toBe(false)
    expect(isNewer("2.2.5", "2.2.6")).toBe(false)
    expect(isNewer("nonsense", "2.2.5")).toBe(false)
    expect(isNewer("2.2.6", "nonsense")).toBe(false)
  })
})