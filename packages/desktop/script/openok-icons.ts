#!/usr/bin/env bun
// Regenerates the OpenOK app icon from the mascot artwork so installed builds carry it on every platform.
// electron-builder packages whatever sits in icons/<channel>, so every size there must come from the mascot.
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"

const dir = path.resolve(import.meta.dir, "..")

const mascot = path.resolve(dir, "../../site/assets/load.png")

const channels = ["dev", "beta", "prod"] as const

const icoSizes = [16, 24, 32, 48, 64, 128, 256]

// A 505x512 source would be stretched by the packagers, so the build refuses anything that is not square.
export async function buildOpenokIcons() {
  const png = await readFile(mascot)
  const size = pngSize(png)

  if (size.width !== size.height) throw new Error(`The OpenOK app icon must be square, got ${size.width}x${size.height}: ${mascot}`)

  if ((await stat(mascot)).size === 0) throw new Error(`The OpenOK app icon is empty: ${mascot}`)

  const image = new Bun.Image(png)
  const ico = buildIco(await Promise.all(icoSizes.map(async (size) => ({ size, data: await render(image, size) }))))

  for (const channel of channels) {
    const target = path.join(dir, "icons", channel)
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, "icon.png"), png)
    await writeFile(path.join(target, "icon.ico"), ico)

    // Keep the per-size PNGs the packagers pick up in step with the mascot instead of leaving upstream artwork behind.
    for (const name of await readdir(target)) {
      if (!name.endsWith(".png") || name === "icon.png") continue
      const existing = pngSize(await readFile(path.join(target, name)))

      if (!existing.width || !existing.height) continue
      await writeFile(path.join(target, name), await render(image, existing.width, existing.height))
    }
  }
}

async function render(image: InstanceType<typeof Bun.Image>, width: number, height = width) {
  const resized = image.resize(width, height)

  return new Uint8Array(await (await resized.png()).bytes())
}

function pngSize(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)

  return { width: view.getUint32(16), height: view.getUint32(20) }
}

// An ICO is a directory of PNG frames, which is what Windows 10 and later read for every size.
function buildIco(frames: { size: number; data: Uint8Array }[]) {
  const header = 6 + frames.length * 16
  const bytes = new Uint8Array(header + frames.reduce((total, frame) => total + frame.data.byteLength, 0))
  const view = new DataView(bytes.buffer)

  view.setUint16(2, 1, true)
  view.setUint16(4, frames.length, true)

  let offset = header
  frames.forEach((frame, index) => {
    const entry = 6 + index * 16
    // 256 is stored as 0 in the ICO directory.
    bytes[entry] = frame.size === 256 ? 0 : frame.size
    bytes[entry + 1] = frame.size === 256 ? 0 : frame.size
    view.setUint16(entry + 4, 1, true)
    view.setUint16(entry + 6, 32, true)
    view.setUint32(entry + 8, frame.data.byteLength, true)
    view.setUint32(entry + 12, offset, true)
    bytes.set(frame.data, offset)
    offset += frame.data.byteLength
  })

  return bytes
}
