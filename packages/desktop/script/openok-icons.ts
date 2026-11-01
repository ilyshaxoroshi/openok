#!/usr/bin/env bun
// Regenerates the OpenOK app icon from the mascot artwork so installed builds carry it on every platform.
// electron-builder derives icon.ico, icon.icns and the Linux PNG set from the 512px source below.
import { copyFile, mkdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

const dir = path.resolve(import.meta.dir, "..")
const mascot = path.resolve(dir, "../../site/assets/load.png")
const channels = ["dev", "beta", "prod"] as const

// A 505x512 source would be stretched by the packagers, so the build refuses anything that is not square.
export async function buildOpenokIcons() {
  const png = await readFile(mascot)
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)

  if (width !== height) throw new Error(`The OpenOK app icon must be square, got ${width}x${height}: ${mascot}`)
  if ((await stat(mascot)).size === 0) throw new Error(`The OpenOK app icon is empty: ${mascot}`)

  for (const channel of channels) {
    const target = path.join(dir, "icons", channel)
    await mkdir(target, { recursive: true })
    await copyFile(mascot, path.join(target, "icon.png"))
  }
}
