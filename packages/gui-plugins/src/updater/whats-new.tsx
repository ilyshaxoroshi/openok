import { createSignal, Index, Show } from "solid-js"
import { Button } from "@opencode/ui/button"
import { Dialog } from "@opencode/ui/dialog"
import { usePlugin, type DialogHandle, type SetupContext } from "@opencode/plugin/gui"
import { RELEASES } from "./changelog"
import type definition from "./index"

type Highlight = {
  title: string
  description: string
  media?: { type: "image" | "video"; src: string; alt?: string }
}

/**
 * Shows OpenOK's release highlights for the releases since `previous` and remembers the current version as seen. A
 * release without highlights only remembers the version.
 */
export function showWhatsNew(
  ctx: SetupContext<typeof definition>,
  input: { readonly previous: string; readonly current: string; readonly markSeen: () => void },
) {
  const highlights = sliceHighlights(RELEASES, input.current, input.previous)

  if (highlights.length === 0) return input.markSeen()

  const timer = setTimeout(() => {
    input.markSeen()
    ctx.dialogs.open((dialog) => <DialogReleaseNotes highlights={highlights} dialog={dialog} />, { replace: true })
  }, 500)

  ctx.signal.addEventListener("abort", () => clearTimeout(timer))
}

function normalizeVersion(value: string | undefined) {
  const text = value?.trim()

  if (!text) return

  return text.startsWith("v") || text.startsWith("V") ? text.slice(1) : text
}

function sliceHighlights(list: { tag?: string; highlights: Highlight[] }[], current: string, previous: string) {
  const now = normalizeVersion(current)
  const before = normalizeVersion(previous)

  const start = (() => {
    if (!now) return 0

    const index = list.findIndex((release) => normalizeVersion(release.tag) === now)

    return index === -1 ? 0 : index
  })()

  const end = (() => {
    if (!before) return list.length

    const index = list.findIndex((release, i) => i >= start && normalizeVersion(release.tag) === before)

    return index === -1 ? list.length : index
  })()

  const seen = new Set<string>()

  return list
    .slice(start, end)
    .flatMap((release) => release.highlights)
    .filter((item) => {
      const key = [item.title, item.description, item.media?.type ?? "", item.media?.src ?? ""].join("\n")

      if (seen.has(key)) return false

      seen.add(key)

      return true
    })
    .slice(0, 5)
}

function DialogReleaseNotes(props: { highlights: Highlight[]; dialog: DialogHandle }) {
  const ctx = usePlugin<typeof definition>()
  const [index, setIndex] = createSignal(0)

  const total = () => props.highlights.length
  const last = () => Math.max(0, total() - 1)
  const feature = () => props.highlights[index()] ?? props.highlights[last()]
  const isFirst = () => index() === 0
  const isLast = () => index() >= last()
  const paged = () => total() > 1

  function handleNext() {
    if (isLast()) return

    setIndex(index() + 1)
  }

  function handleClose() {
    props.dialog.close()
  }

  function handleDisable() {
    ctx.stores.releaseNotes.update((draft) => {
      draft.enabled = false
    })
    handleClose()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      handleClose()

      return
    }

    if (!paged()) return

    if (e.key === "ArrowLeft" && !isFirst()) {
      e.preventDefault()
      setIndex(index() - 1)
    }

    if (e.key === "ArrowRight" && !isLast()) {
      e.preventDefault()
      setIndex(index() + 1)
    }
  }

  return (
    <Dialog
      size="large"
      fit
      class="w-[min(calc(100vw-40px),720px)] h-[min(calc(100vh-40px),400px)] -mt-20 min-h-0 overflow-hidden"
    >
      <div class="flex flex-1 min-w-0 min-h-0" tabIndex={0} autofocus onKeyDown={handleKeyDown}>
        {/* Left side - Text content */}
        <div class="flex flex-col flex-1 min-w-0 p-8">
          {/* Top section - feature content (fixed position from top) */}
          <div class="flex flex-col gap-2 pt-22">
            <div class="flex items-center gap-2">
              <h1 class="text-16-medium text-text-strong">{feature()?.title ?? ""}</h1>
            </div>
            <p class="text-14-regular text-text-base">{feature()?.description ?? ""}</p>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div class="flex-1" />

          {/* Bottom section - buttons and indicators (fixed position) */}
          <div class="flex flex-col gap-12">
            <div class="flex flex-col items-start gap-3">
              <Show
                when={isLast()}
                fallback={
                  <Button variant="neutral" size="large" onClick={handleNext}>
                    {ctx.t("releaseNotes.action.next")}
                  </Button>
                }
              >
                <Button variant="contrast" size="large" onClick={handleClose}>
                  {ctx.t("releaseNotes.action.getStarted")}
                </Button>
              </Show>

              <Button variant="ghost" size="small" onClick={handleDisable}>
                {ctx.t("releaseNotes.action.hideFuture")}
              </Button>
            </div>

            <Show when={paged()}>
              <div class="flex items-center gap-1.5 -my-2.5">
                <Index each={props.highlights}>
                  {(_, i) => (
                    <button
                      type="button"
                      class="h-6 flex items-center cursor-pointer bg-transparent border-none p-0 transition-all duration-200"
                      classList={{
                        "w-8": i === index(),
                        "w-3": i !== index(),
                      }}
                      onClick={() => setIndex(i)}
                    >
                      <div
                        class="w-full h-0.5 rounded-[1px] transition-colors duration-200"
                        classList={{
                          "bg-icon-strong-base": i === index(),
                          "bg-icon-weak-base": i !== index(),
                        }}
                      />
                    </button>
                  )}
                </Index>
              </div>
            </Show>
          </div>
        </div>

        {/* Right side - Media content (edge to edge), or the mascot when the notes carry no media */}
        <Show
          when={feature()?.media}
          fallback={
            <div class="relative flex-1 min-w-0 overflow-hidden rounded-r-xl bg-surface-base">
              <div
                aria-hidden="true"
                class="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 62%, rgba(124,196,255,0.32), rgba(184,166,255,0.12) 45%, transparent 70%)",
                }}
              />
              <img
                src="/ok.png"
                alt=""
                class="absolute inset-0 m-auto w-[68%] max-w-[220px] object-contain"
                style={{ filter: "drop-shadow(0 24px 46px rgba(94,200,255,0.45))" }}
              />
            </div>
          }
        >
          {(media) => (
            <div class="flex-1 min-w-0 bg-surface-base overflow-hidden rounded-r-xl">
              <Show
                when={media().type === "image"}
                fallback={
                  <video src={media().src} autoplay loop muted playsinline class="w-full h-full object-cover" />
                }
              >
                <img
                  src={media().src}
                  alt={media().alt ?? feature()?.title ?? ctx.t("releaseNotes.media.alt")}
                  class="w-full h-full object-cover"
                />
              </Show>
            </div>
          )}
        </Show>
      </div>
    </Dialog>
  )
}
