import { Show, createSignal, onCleanup, onMount } from "solid-js"
import { useLanguage } from "@/runtime/i18n/language"
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
  let handle = 0
  let previous: number | undefined
  let dragging = false
  let origin = { x: 0, y: 0 }
  let pointer: { id: number; offsetX: number; offsetY: number } | undefined

  const body: Body = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0 }
  const [ready, setReady] = createSignal(false)

  // Picking the pet up snaps it back to its classic upright pose.
  const upright = () => {
    body.angle = 0
    body.spin = 0
    paint()
  }

  const clampSpin = () => {
    body.spin = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, body.spin))
  }

  const bounds = () => {
    const width = Math.max(SIZE, window.innerWidth)
    const height = Math.max(SIZE, window.innerHeight)
    return { width, height }
  }

  const place = () => {
    // A little in from the bottom-left corner, as the pet's home.
    const { height } = bounds()
    body.x = 96
    body.y = Math.max(0, height - SIZE - 96)
    body.vx = 0
    body.vy = 0
    body.angle = 0
    body.spin = 0
    paint()
  }

  const paint = () => {
    element.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.angle}rad)`
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
    handle = requestAnimationFrame(frame)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    element.setPointerCapture(event.pointerId)
    dragging = true
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
    handle = requestAnimationFrame(frame)
    window.addEventListener("resize", place)
    onCleanup(() => {
      cancelAnimationFrame(handle)
      window.removeEventListener("resize", place)
    })
  })

  return (
    <div
      ref={element}
      data-component="ok-pet"
      data-physics={props.physics ? "on" : "off"}
      data-ready={ready() ? "true" : "false"}
      role="img"
      aria-label={props.label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src="/ok.png" alt="" draggable={false} />
    </div>
  )
}
