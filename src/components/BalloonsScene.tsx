'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './BalloonsScene.module.css'

export interface BalloonCity {
  slug: string
  label: string
  active: boolean
  color: string
}

// ── Physics constants ──────────────────────────────────────────────────────────

const BUOYANCY    = 0.07    // upward acceleration (px/frame²)
const LIN_DAMP    = 0.984   // linear velocity damping per frame
const ANG_DAMP    = 0.978   // angular velocity damping — air resistance on rotation
const DRIFT       = 0.025   // random horizontal noise per frame
const MAX_V       = 5.0     // max linear velocity (px/frame)
const MAX_OMEGA   = 0.05    // max angular velocity (rad/frame)
const RESTITUTION = 0.35    // collision bounciness
const CEIL_REST   = 0.12    // softer ceiling — balloons settle gently at top
const GAP         = 10      // wall clearance (px)

// ── Body ──────────────────────────────────────────────────────────────────────

interface Body {
  idx:     number
  x:       number    // center position x
  y:       number    // center position y
  vx:      number    // linear velocity x
  vy:      number    // linear velocity y
  angle:   number    // rotation in radians
  omega:   number    // angular velocity (rad/frame)
  w:       number    // pill width  (px)
  h:       number    // pill height (px)
  r:       number    // capsule radius = h/2
  invMass: number    // 1/mass  (uniform mass = 1)
  invI:    number    // 1/moment-of-inertia
}

// ── Vec helpers (inline, no allocations in hot path) ─────────────────────────

function cross2(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx
}

// Capsule spine: two circle-center endpoints in world space
function getSpine(b: Body): [number, number, number, number] {
  const hl = b.w / 2 - b.r
  const c  = Math.cos(b.angle), s = Math.sin(b.angle)
  return [
    b.x - hl * c, b.y - hl * s,   // p1
    b.x + hl * c, b.y + hl * s,   // p2
  ]
}

// ── Closest points between two line segments ──────────────────────────────────
// Returns [cp_x, cp_y, cq_x, cq_y] — closest point on seg1 and seg2

function closestSegSeg(
  p1x: number, p1y: number, p2x: number, p2y: number,
  q1x: number, q1y: number, q2x: number, q2y: number,
): [number, number, number, number] {
  const d1x = p2x - p1x, d1y = p2y - p1y
  const d2x = q2x - q1x, d2y = q2y - q1y
  const rx  = p1x - q1x, ry  = p1y - q1y
  const a   = d1x * d1x + d1y * d1y
  const e   = d2x * d2x + d2y * d2y
  const f   = d2x * rx  + d2y * ry
  const EPS = 1e-9

  let s: number, t: number

  if (a < EPS && e < EPS) return [p1x, p1y, q1x, q1y]

  if (a < EPS) {
    s = 0
    t = Math.max(0, Math.min(1, f / e))
  } else {
    const c = d1x * rx + d1y * ry
    if (e < EPS) {
      t = 0
      s = Math.max(0, Math.min(1, -c / a))
    } else {
      const bv  = d1x * d2x + d1y * d2y
      const den = a * e - bv * bv
      s = den > EPS ? Math.max(0, Math.min(1, (bv * f - c * e) / den)) : 0
      t = (bv * s + f) / e
      if      (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)) }
      else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (bv - c) / a)) }
    }
  }

  return [p1x + d1x * s, p1y + d1y * s, q1x + d2x * t, q1y + d2y * t]
}

// ── Wall collision impulse (infinite-mass wall) ───────────────────────────────
// nx/ny = wall normal pointing INTO the body. cx/cy = contact point.

function applyWallImpulse(
  b: Body, nx: number, ny: number, cx: number, cy: number, e: number,
) {
  const rx = cx - b.x, ry = cy - b.y
  // Velocity of contact point on body
  const vcx = b.vx - b.omega * ry
  const vcy = b.vy + b.omega * rx
  const vn  = vcx * nx + vcy * ny
  if (vn >= 0) return  // already separating

  const rxn   = cross2(rx, ry, nx, ny)
  const denom = b.invMass + rxn * rxn * b.invI
  if (denom < 1e-10) return

  const j = -(1 + e) * vn / denom
  b.vx    += j * nx * b.invMass
  b.vy    += j * ny * b.invMass
  b.omega += j * rxn * b.invI
}

// ── Capsule-capsule rigid-body collision ──────────────────────────────────────

function collideCapsules(a: Body, b: Body): void {
  const minDist = a.r + b.r
  const [a1x, a1y, a2x, a2y] = getSpine(a)
  const [b1x, b1y, b2x, b2y] = getSpine(b)
  const [cpx, cpy, cqx, cqy] = closestSegSeg(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y)

  const dx   = cqx - cpx, dy = cqy - cpy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= minDist || dist < 1e-9) return

  const inv = 1 / dist
  const nx  = dx * inv, ny = dy * inv   // collision normal A → B
  const pen = minDist - dist

  // Positional correction: push bodies apart
  const corr = pen * 0.5
  a.x -= nx * corr;  a.y -= ny * corr
  b.x += nx * corr;  b.y += ny * corr

  // Contact point: midpoint of overlapping surfaces
  const contx = cpx + nx * a.r
  const conty = cpy + ny * a.r

  // Moment arms (center → contact)
  const rax = contx - a.x, ray = conty - a.y
  const rbx = contx - b.x, rby = conty - b.y

  // Velocity of contact point on each body
  const vax = a.vx - a.omega * ray,  vay = a.vy + a.omega * rax
  const vbx = b.vx - b.omega * rby,  vby = b.vy + b.omega * rbx

  // Relative velocity along normal (b relative to a)
  const vn = (vbx - vax) * nx + (vby - vay) * ny
  if (vn > 0) return  // separating

  const raxn  = cross2(rax, ray, nx, ny)
  const rbxn  = cross2(rbx, rby, nx, ny)
  const denom = a.invMass + b.invMass + raxn * raxn * a.invI + rbxn * rbxn * b.invI
  if (denom < 1e-10) return

  const j = -(1 + RESTITUTION) * vn / denom

  // Apply linear impulse
  a.vx -= j * nx * a.invMass;  a.vy -= j * ny * a.invMass
  b.vx += j * nx * b.invMass;  b.vy += j * ny * b.invMass

  // Apply angular impulse: Δω = (r × J) / I
  a.omega -= j * raxn * a.invI
  b.omega += j * rbxn * b.invI
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BalloonsScene({ cities, onNavigate }: { cities: BalloonCity[]; onNavigate?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRefs     = useRef<(HTMLElement | null)[]>(Array(cities.length).fill(null))
  const rafRef       = useRef<number>(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let bodies: Body[] = []

    function init() {
      const W = container!.offsetWidth
      const H = container!.offsetHeight
      if (W === 0 || H === 0) return

      bodies = []
      for (let i = 0; i < cities.length; i++) {
        const el = pillRefs.current[i]
        if (!el) continue
        const w = el.offsetWidth
        const h = el.offsetHeight
        if (w === 0 || h === 0) continue

        const r = h / 2
        // Uniform mass = 1; I = (w² + h²) / 12 (rectangle approximation)
        const I = (w * w + h * h) / 12

        // Spread across full container for diagonal variety
        const x = GAP + w / 2 + Math.random() * Math.max(1, W - w - GAP * 2)
        const y = H * 0.1 + Math.random() * H * 0.8

        bodies.push({
          idx: i, x, y,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 1.5 + 0.5),
          angle: (Math.random() - 0.5) * 0.5,
          omega: (Math.random() - 0.5) * 0.015,
          w, h, r,
          invMass: 1.0,
          invI: 1 / I,
        })

        el.style.left = `${x - w / 2}px`
        el.style.top  = `${y - h / 2}px`
        el.setAttribute('data-ready', '1')
      }
    }

    function step() {
      const W = container!.offsetWidth
      const H = container!.offsetHeight

      // ── Integrate forces & damping ─────────────────────────────────────────
      for (const b of bodies) {
        b.vy   -= BUOYANCY
        b.vx   += (Math.random() - 0.5) * DRIFT
        b.vx   *= LIN_DAMP
        b.vy   *= LIN_DAMP
        b.omega *= ANG_DAMP

        if (b.vx >  MAX_V) b.vx =  MAX_V
        if (b.vx < -MAX_V) b.vx = -MAX_V
        if (b.vy >  MAX_V) b.vy =  MAX_V
        if (b.vy < -MAX_V) b.vy = -MAX_V
        if (b.omega >  MAX_OMEGA) b.omega =  MAX_OMEGA
        if (b.omega < -MAX_OMEGA) b.omega = -MAX_OMEGA

        b.x     += b.vx
        b.y     += b.vy
        b.angle += b.omega
      }

      // ── Wall collisions ────────────────────────────────────────────────────
      for (const b of bodies) {
        // Compute spine extents
        let [p1x, p1y, p2x, p2y] = getSpine(b)

        // Left wall
        const leftEdge = Math.min(p1x, p2x) - b.r
        if (leftEdge < GAP) {
          b.x += GAP - leftEdge
          ;[p1x, p1y, p2x, p2y] = getSpine(b)
          const spineLeft = p1x < p2x
          applyWallImpulse(b, 1, 0, GAP, spineLeft ? p1y : p2y, RESTITUTION)
        }

        // Right wall
        const rightEdge = Math.max(p1x, p2x) + b.r
        if (rightEdge > W - GAP) {
          b.x -= rightEdge - (W - GAP)
          ;[p1x, p1y, p2x, p2y] = getSpine(b)
          const spineRight = p1x > p2x
          applyWallImpulse(b, -1, 0, W - GAP, spineRight ? p1y : p2y, RESTITUTION)
        }

        // Ceiling (soft)
        const topEdge = Math.min(p1y, p2y) - b.r
        if (topEdge < GAP) {
          b.y += GAP - topEdge
          ;[p1x, p1y, p2x, p2y] = getSpine(b)
          const spineTop = p1y < p2y
          applyWallImpulse(b, 0, 1, spineTop ? p1x : p2x, GAP, CEIL_REST)
        }

        // Floor
        const bottomEdge = Math.max(p1y, p2y) + b.r
        if (bottomEdge > H - GAP) {
          b.y -= bottomEdge - (H - GAP)
          ;[p1x, p1y, p2x, p2y] = getSpine(b)
          const spineBot = p1y > p2y
          applyWallImpulse(b, 0, -1, spineBot ? p1x : p2x, H - GAP, RESTITUTION)
        }
      }

      // ── Capsule-capsule collisions ─────────────────────────────────────────
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          collideCapsules(bodies[i], bodies[j])
        }
      }

      // ── Write to DOM ───────────────────────────────────────────────────────
      for (const b of bodies) {
        const el = pillRefs.current[b.idx]
        if (!el) continue
        el.style.left      = `${b.x - b.w / 2}px`
        el.style.top       = `${b.y - b.h / 2}px`
        el.style.transform = `rotate(${b.angle * (180 / Math.PI)}deg)`
      }

      rafRef.current = requestAnimationFrame(step)
    }

    // One-frame delay so layout is complete before measuring pill sizes
    rafRef.current = requestAnimationFrame(() => {
      init()
      rafRef.current = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(rafRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className={styles.container}>
      {cities.map((city, i) =>
        city.active ? (
          <Link
            key={city.slug}
            href={`/${city.slug}`}
            className={styles.pill}
            ref={(el: HTMLAnchorElement | null) => { pillRefs.current[i] = el }}
            style={{ '--pill-bg': city.color } as React.CSSProperties}
            onClick={onNavigate}
          >
            {city.label}
          </Link>
        ) : (
          <div
            key={city.slug}
            className={styles.pillDisabled}
            ref={(el: HTMLDivElement | null) => { pillRefs.current[i] = el }}
            style={{ '--pill-bg': city.color } as React.CSSProperties}
          >
            <span>{city.label}</span>
            <span className={styles.comingSoon}>Coming Soon</span>
          </div>
        )
      )}
    </div>
  )
}
