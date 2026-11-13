import { Option, Schema } from "effect"

const releaseApi = "https://api.github.com/repos/ilyshaxoroshi/openok/releases/latest"

const GithubRelease = Schema.Struct({
  tag_name: Schema.String,
  html_url: Schema.String,
})

export type Release = {
  readonly version: string
  readonly url: string
}

/**
 * The latest published release when it is newer than `current`, or undefined when the check fails,
 * the current build is newer, or the request is aborted.
 */
export async function latest(current: string, signal?: AbortSignal): Promise<Release | undefined> {
  const response = await fetch(releaseApi, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  }).catch(() => undefined)

  if (!response?.ok) return

  const parsed = Schema.decodeUnknownOption(GithubRelease)(await response.json())

  if (Option.isNone(parsed)) return

  const version = parsed.value.tag_name.replace(/^v/, "")

  if (!isNewer(version, current)) return

  return { version, url: parsed.value.html_url }
}

/** Whether `candidate` is a newer major.minor.patch version than `current`; other shapes never win. */
export function isNewer(candidate: string, current: string) {
  const next = versionParts(candidate)
  const existing = versionParts(current)

  if (!next || !existing) return false

  for (let index = 0; index < 3; index++) {
    if (next[index] === existing[index]) continue

    return next[index] > existing[index]
  }

  return false
}

function versionParts(version: string) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version)

  if (!match) return

  return [Number(match[1]), Number(match[2]), Number(match[3])] as const
}