import { Show, createSignal, onCleanup, onMount } from "solid-js"
import { useLanguage } from "@/runtime/i18n/language"
import { useSettings } from "@/settings/model"
import "./ok-pet.css"

// The "OK" mascot: a draggable pet that sits above the app and, when physics is on, falls, tumbles and bumps into the
// window edges. Everything is written straight to the element transform so dragging never re-renders the tree.
const SIZE = 96
const GRAVITY = 2200
const RESTITUTION = 0.42
const FRICTION = 0.82
const AIR_DRAG = 0.999
const SPIN_DAMPING = 0.985
const PIXELS_PER_METER = 220

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
      if (Math.abs(body.vy) > 60) body.vy = -body.vy * RESTITUTION
      else body.vy = 0
      body.vx *= FRICTION
      // Rolling: the contact point pushes the body into a spin.
      body.spin = body.vx / (SIZE / PIXELS_PER_METER)
    }

    if (body.y < 0) {
      body.y = 0
      body.vy = Math.abs(body.vy) * RESTITUTION
    }

    if (body.x < 0) {
      body.x = 0
      body.vx = Math.abs(body.vx) * RESTITUTION
    }

    if (body.x + SIZE > width) {
      body.x = width - SIZE
      body.vx = -Math.abs(body.vx) * RESTITUTION
    }

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
    pointer = { id: event.pointerId, offsetX: event.clientX - body.x, offsetY: event.clientY - body.y }
    body.vx = 0
    body.vy = 0
    body.spin = 0
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
    // Fling: how far the pointer travelled per frame becomes the body's momentum.
    if (props.physics) {
      body.vx = (event.clientX - origin.x) * 6
      body.vy = (event.clientY - origin.y) * 6
      body.spin = body.vx * 0.02
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
      <img src="/load.png" alt="" draggable={false} />
    </div>
  )
}
