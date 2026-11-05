// Keeps the install card in sync with the latest GitHub release.
// Falls back to the static markup when the API is unavailable.
const API = "https://api.github.com/repos/ilyshaxoroshi/openok/releases/latest"
const REPO = "https://github.com/ilyshaxoroshi/openok"
const CACHE_KEY = "openok.latest-release"
const CACHE_TTL = 10 * 60 * 1000

function escape(value) {
  return value.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  )
}

function inline(value) {
  return escape(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
}

// Release bodies may carry an English part and a Russian part separated by <!-- ru -->.
function parseNotes(body, lang) {
  const parts = String(body || "").split("<!-- ru -->")
  const text = (lang === "ru" && parts[1] ? parts[1] : parts[0]) || ""
  const sections = []
  let section
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const heading = line.match(/^#{2,4}\s+(.+)$/)
    if (heading) {
      const title = heading[1].trim()
      if (/^(install|установк)/i.test(title)) break
      section = { title, items: [] }
      sections.push(section)
      continue
    }
    if (/^\*\*OpenOK\s+[\d.]+\*\*$/.test(line)) continue
    if (!section) continue
    section.items.push(line.replace(/^[-*]\s+/, ""))
  }
  return sections
}

function apply(release) {
  const version = String(release.tag_name || "").replace(/^v/i, "")
  if (!version) return

  for (const el of document.querySelectorAll("[data-release-version]")) el.textContent = version

  const lang = document.documentElement.lang || "en"
  const notes = document.querySelector("[data-release-notes]")
  const sections = parseNotes(release.body, lang)
  if (notes && sections.length) {
    notes.innerHTML = sections
      .map(
        (section) =>
          (section.title ? `<h4>${inline(section.title)}</h4>` : "") +
          (section.items.length
            ? `<ul>${section.items.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`
            : ""),
      )
      .join("")
  }

  const assets = release.assets || []
  const asset = (pattern) => assets.find((item) => pattern.test(item.name))

  const windows = asset(/-win-x64\.exe$/i)
  for (const el of document.querySelectorAll("[data-release-download]")) {
    el.href = windows ? windows.browser_download_url : `${REPO}/releases/download/${release.tag_name}/OpenOK-win-x64.exe`
  }
  for (const el of document.querySelectorAll("[data-release-all]")) {
    el.href = release.html_url || `${REPO}/releases/tag/${release.tag_name}`
  }

  const appimage = asset(/\.AppImage$/i)
  const deb = asset(/\.deb$/i)
  for (const el of document.querySelectorAll("[data-release-appimage]")) {
    if (!appimage) {
      el.hidden = true
      continue
    }
    el.href = appimage.browser_download_url
    el.hidden = false
  }
  for (const el of document.querySelectorAll("[data-release-deb]")) {
    if (!deb) {
      el.hidden = true
      continue
    }
    el.href = deb.browser_download_url
    el.hidden = false
  }
}

function cached() {
  try {
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || "null")
    if (stored && Date.now() - stored.at < CACHE_TTL) return stored.release
  } catch {}
  return undefined
}

function store(release) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), release }))
  } catch {}
}

async function load() {
  const fresh = cached()
  if (fresh) return fresh
  const response = await fetch(API, { headers: { Accept: "application/vnd.github+json" } })
  if (!response.ok) throw new Error(String(response.status))
  const release = await response.json()
  store(release)
  return release
}

load()
  .then(apply)
  .catch(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || "null")
      if (stored?.release) apply(stored.release)
    } catch {}
  })
