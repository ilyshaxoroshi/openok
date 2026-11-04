import { Show, createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js"
import { useLanguage } from "@/runtime/i18n/language"
import { useGlobal } from "@/runtime/server/runtime"
import { useCurrentRoute } from "@/shell/state/layout"
import { useSettings } from "@/settings/model"
import "./ok-pet.css"

// The "OK" mascot: a draggable pet that sits above the app and, when physics is on, falls, tumbles and bumps into the
// window edges. Everything is written straight to the element transform so dragging never re-renders the tree.
const SIZE = 96

const GRAVITY = 2200

const RESTITUTION = 0.74

const FRICTION = 0.9

const AIR_DRAG = 0.999

const SPIN_DAMPING = 0.995

const IMPACT_SPIN = 5

const WALL_SPIN = 9

const MAX_SPIN = 26

const THROW = 9

const THROW_SPIN = 0.05

// The pet dozes off when it has been left alone and has settled.
const SLEEP_AFTER = 25_000

const POSITION_KEY = "openok.pet.position"

type Body = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
}

export function OkPet() {
  const settings = useSettings()
  const language = useLanguage()

  return (
    <Show when={settings.appearance.pet()}>
      <OkPetBody
        physics={settings.appearance.petPhysics()}
        label={language.t("settings.appearance.row.pet.title")}
      />
    </Show>
  )
}

function OkPetBody(props: { physics: boolean; label: string }) {
  let element!: HTMLDivElement
  let bursts!: HTMLDivElement
  let handle = 0
  let previous: number | undefined
  let dragging = false
  let lastActive = 0
  let origin = { x: 0, y: 0 }
  let pointer: { id: number; offsetX: number; offsetY: number } | undefined
  let meow: HTMLAudioElement | undefined
  const timers = new Set<number>()

  const global = useGlobal()
  const route = useCurrentRoute()

  const body: Body = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0 }
  const [ready, setReady] = createSignal(false)
  const [sleeping, setSleeping] = createSignal(false)

  // The pet follows the session in view: while the agent works there it stays awake and fidgets, and when that
  // run finishes it cheers, but leaving a busy session for another screen is not a finish.
  const activity = createMemo(() => {
    const current = route()

    if (current.type !== "session") return { session: undefined, working: false }

    const ctx = global.serverCtx(current.server)

    return { session: current.sessionId, working: ctx?.data.session.status(current.sessionId) === "running" }
  })

  const working = () => activity().working

  // Picking the pet up snaps it back to its classic upright pose.
  const upright = () => {
    body.angle = 0
    body.spin = 0
    paint()
  }

  const clampSpin = () => {
    body.spin = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, body.spin))
  }

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

  const bounds = () => {
    const width = Math.max(SIZE, window.innerWidth)
    const height = Math.max(SIZE, window.innerHeight)

    return { width, height }
  }

  const readPosition = () => {
    // Stored as "x,y": a malformed value just means the pet starts at home.
    const [x, y] = (localStorage.getItem(POSITION_KEY) ?? "").split(",").map(Number)

    if (!Number.isFinite(x) || !Number.isFinite(y)) return

    return { x, y }
  }

  const savePosition = () => {
    localStorage.setItem(POSITION_KEY, `${Math.round(body.x)},${Math.round(body.y)}`)
  }

  const place = () => {
    const { width, height } = bounds()
    const saved = readPosition()
    // A remembered spot from a larger window is pulled back inside the current one.
    body.x = clamp(saved?.x ?? 96, 0, width - SIZE)
    body.y = clamp(saved?.y ?? height - SIZE - 96, 0, height - SIZE)
    body.vx = 0
    body.vy = 0
    body.angle = 0
    body.spin = 0
    paint()
  }

  // Resizing keeps the pet where it is until the window would cut it off.
  const fit = () => {
    const { width, height } = bounds()
    body.x = clamp(body.x, 0, width - SIZE)
    body.y = clamp(body.y, 0, height - SIZE)
    paint()
  }

  const paint = () => {
    element.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.angle}rad)`
  }

  const wake = () => {
    lastActive = performance.now()

    if (sleeping()) setSleeping(false)
  }

  const step = (dt: number) => {
    const { width, height } = bounds()

    if (!props.physics) {
      paint()

      return
    }

    body.vy += GRAVITY * dt
    body.vx *= AIR_DRAG
    body.x += body.vx * dt
    body.y += body.vy * dt
    body.angle += body.spin * dt
    body.spin *= SPIN_DAMPING

    if (body.y + SIZE > height) {
      body.y = height - SIZE

      if (Math.abs(body.vy) > 60) {
        // Lively bounce: the pet pops back up instead of settling instantly.
        body.vy = -body.vy * RESTITUTION
        // An off-centre landing kicks the body so a drop also tumbles it.
        body.spin += (body.vx / SIZE) * IMPACT_SPIN
      } else body.vy = 0
      body.vx *= FRICTION
    }

    if (body.y < 0) {
      body.y = 0
      body.vy = Math.abs(body.vy) * RESTITUTION
      body.spin *= -0.8
    }

    if (body.x < 0) {
      body.x = 0
      body.vx = Math.abs(body.vx) * RESTITUTION
      body.spin = -Math.abs(body.spin) - WALL_SPIN
    }

    if (body.x + SIZE > width) {
      body.x = width - SIZE
      body.vx = -Math.abs(body.vx) * RESTITUTION
      body.spin = Math.abs(body.spin) + WALL_SPIN
    }

    clampSpin()
    paint()
  }

  const frame = (time: number) => {
    const last = previous ?? time
    previous = time
    const dt = Math.min(0.032, (time - last) / 1000)

    if (!dragging) step(dt)
    // Doze off only once the body has settled, so a slow fall never counts as sleep. A working agent keeps the pet
    // up even while it sits still.
    const rest = Math.abs(body.vx) < 30 && Math.abs(body.vy) < 30
    const idle = !working() && rest && time - lastActive > SLEEP_AFTER

    if (idle !== sleeping()) setSleeping(idle)
    handle = requestAnimationFrame(frame)
  }

  const playMeow = () => {
    meow ??= new Audio("/meow.ogg")
    meow.currentTime = 0
    meow.volume = 0.45
    void meow.play().catch(() => {})
  }

  const burst = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Hearts rise out of the pet and clean themselves up.
    for (let index = 0; index < 5; index++) {
      const heart = document.createElement("span")
      heart.className = "ok-pet-heart"
      heart.textContent = "♥"
      heart.style.setProperty("--heart-x", `${(Math.random() - 0.5) * 70}px`)
      heart.style.setProperty("--heart-lift", `${60 + Math.random() * 40}px`)
      heart.style.animationDelay = `${index * 60}ms`
      bursts.append(heart)

      const timer = window.setTimeout(() => {
        heart.remove()
        timers.delete(timer)
      }, 1500 + index * 60)

      timers.add(timer)
    }
  }

  const celebrate = () => {
    wake()
    playMeow()
    burst()
  }

  const cheer = () => {
    wake()
    burst()
  }

  // Start fidgeting as soon as the agent gets to work, and cheer when that session finishes rather than when the user
  // merely leaves it.
  createEffect(
    on(activity, (next, last) => {
      if (next.working) {
        wake()

        return
      }

      if (last?.working && last.session === next.session) cheer()
    }),
  )

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    element.setPointerCapture(event.pointerId)
    dragging = true
    wake()
    origin = { x: event.clientX, y: event.clientY }
    body.vx = 0
    body.vy = 0
    upright()
    // Measure the grab offset after the rotation resets, so the pet does not jump in the hand.
    const rect = element.getBoundingClientRect()
    pointer = { id: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top }
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || !pointer || pointer.id !== event.pointerId) return
    wake()
    const { width, height } = bounds()
    body.x = Math.min(Math.max(0, event.clientX - pointer.offsetX), width - SIZE)
    body.y = Math.min(Math.max(0, event.clientY - pointer.offsetY), height - SIZE)
    paint()
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false

    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    pointer = undefined
    wake()
    savePosition()

    // Fling: how far the pointer travelled becomes the body's momentum, so a small nudge spins it hard.
    if (props.physics) {
      body.vx = (event.clientX - origin.x) * THROW
      body.vy = (event.clientY - origin.y) * THROW
      body.spin = body.vx * THROW_SPIN
      clampSpin()
    }
  }

  onMount(() => {
    place()
    setReady(true)
    lastActive = performance.now()
    handle = requestAnimationFrame(frame)
    window.addEventListener("resize", fit)
    window.addEventListener("pagehide", savePosition)
    onCleanup(() => {
      cancelAnimationFrame(handle)
      window.removeEventListener("resize", fit)
      window.removeEventListener("pagehide", savePosition)

      for (const timer of timers) clearTimeout(timer)
      savePosition()
    })
  })

  return (
    <div
      ref={element}
      data-component="ok-pet"
      data-physics={props.physics ? "on" : "off"}
      data-ready={ready() ? "true" : "false"}
      data-sleeping={sleeping() ? "true" : "false"}
      data-working={working() ? "true" : "false"}
      role="img"
      aria-label={props.label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDblClick={celebrate}
    >
      <img data-slot="ok-pet-awake" src="/ok.png" alt="" draggable={false} />
      <img data-slot="ok-pet-asleep" src="/sleep.png" alt="" draggable={false} />
      <div data-slot="ok-pet-bursts" ref={bursts} aria-hidden="true" />
      <Show when={sleeping()}>
        <span data-slot="ok-pet-z" aria-hidden="true">
          z
        </span>
      </Show>
      <Show when={working()}>
        <span data-slot="ok-pet-think" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </Show>
    </div>
  )
}
