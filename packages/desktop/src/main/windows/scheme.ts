import electron, { type BrowserWindow } from "electron"

export const rendererProtocol = "oc"

export const rendererHost = "renderer"

export function loadWindow(win: BrowserWindow, html: string) {
  const devUrl = process.env.ELECTRON_RENDERER_URL

  if (devUrl) {
    void win.loadURL(new URL(html, devUrlForLoopback(devUrl)).toString())

    return
  }

  void win.loadURL(`${rendererProtocol}://${rendererHost}/${html}`)
}

// Vite binds an IPv4 loopback address, while Windows resolves "localhost" to IPv6 first, so loading the dev
// URL as printed fails with ERR_CONNECTION_REFUSED even though the server is up. Pin the renderer to IPv4.
function devUrlForLoopback(devUrl: string) {
  if (!URL.canParse(devUrl)) return devUrl

  const url = new URL(devUrl)

  if (url.hostname !== "localhost") return devUrl
  url.hostname = "127.0.0.1"

  return url.toString()
}

export function isRendererUrl(value?: string, html = false) {
  if (!value || !URL.canParse(value)) return false
  const url = new URL(value)

  if (html && !url.pathname.endsWith(".html")) return false

  if (url.protocol === `${rendererProtocol}:` && url.host === rendererHost) return true
  const devUrl = process.env.ELECTRON_RENDERER_URL

  if (!devUrl || !URL.canParse(devUrl)) return false

  return url.origin === new URL(devUrl).origin
}

// Scheme privileges can only be granted before the app is ready, so the entry module calls this
// before it loads anything else.
export function registerRendererScheme() {
  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: rendererProtocol,
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        // Plugin fonts and fetched assets are cross-origin to the renderer.
        corsEnabled: true,
        stream: true,
        // Let Chromium keep V8 bytecode for the renderer bundle between launches.
        codeCache: true,
      },
    },
  ])
}
