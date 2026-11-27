/*
  LandingScatter: chalk sketches of the editor's shapes, scattered over the wooden floor.
  The page measures where the text, the robot and the cat are (they move when the window
  changes size) and puts a sketch only into free space. Each new sketch goes to the spot
  that is farthest from the others, so the spread looks random but never clumped.
  Sketches may run off the left and right edges of the window, so some show only a half.
  The sketches are drawn once and never move.
*/
import { useLayoutEffect, useRef, useState } from 'react'

type Kind = 'cube' | 'sphere' | 'cone' | 'cylinder' | 'torus' | 'pyramid'
type Box = { left: number; top: number; right: number; bottom: number }
type Piece = { kind: Kind; x: number; y: number; size: number; turn: number }

// Every shape is drawn in a 100 x 100 square: an outline and a few dotted inner lines.
const SHAPES: Record<Kind, { outline: string; inner: string }> = {
  cube: {
    outline: 'M50,0 L93,25 L93,75 L50,100 L7,75 L7,25 Z',
    inner: 'M50,50 L50,100 M50,50 L7,25 M50,50 L93,25',
  },
  sphere: {
    outline: 'M50,5 A45 45 0 1 1 50,95 A45 45 0 1 1 50,5 Z',
    inner: 'M5,50 A45 14 0 0 0 95,50',
  },
  cone: {
    outline: 'M10,85 L50,5 L90,85 A40 12 0 0 1 10,85 Z',
    inner: 'M10,85 A40 12 0 0 0 90,85',
  },
  cylinder: {
    outline: 'M10,20 A40 12 0 0 1 90,20 L90,80 A40 12 0 0 1 10,80 Z',
    inner: 'M10,20 A40 12 0 0 0 90,20',
  },
  torus: {
    outline: 'M5,50 A45 28 0 1 1 95,50 A45 28 0 1 1 5,50 Z',
    inner: 'M33,50 A17 9 0 1 1 67,50 A17 9 0 1 1 33,50 Z',
  },
  pyramid: {
    outline: 'M50,5 L92,80 L50,95 L8,80 Z',
    inner: 'M50,5 L50,95 M50,5 L8,80 M50,5 L92,80',
  },
}
const KINDS = Object.keys(SHAPES) as Kind[]

// Sketches keep out of these things (the robot and the cat wiggle a little, so a wide gap).
const KEEP_CLEAR = [
  '.landing-title',
  '.landing-lead',
  '.landing-button',
  '.landing-robot',
  '.landing-cat',
  '.landing-about-title',
  '.landing-about-intro',
  '.landing-card',
  '.landing-parents',
].join(', ')
const TEXT_ONLY = '.landing-about-title, .landing-about-intro, .landing-parents'
const GAP = 14
const SIZE_MIN = 92
const SIZE_RANGE = 48
const AREA_PER_SKETCH = 62000
const CANDIDATES = 24
const NEIGHBORS = 3
const FILL_CANDIDATES = 400

// A small random generator with a fixed start, so the same window size gives the same picture.
function makeRandom(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function overlaps(box: Box, x: number, y: number, size: number) {
  return (
    x < box.right + GAP &&
    x + size > box.left - GAP &&
    y < box.bottom + GAP &&
    y + size > box.top - GAP
  )
}

// Distance between a sketch square and a box (0 when they touch or overlap).
function boxGap(box: Box, x: number, y: number, size: number) {
  const dx = Math.max(box.left - (x + size), x - box.right, 0)
  const dy = Math.max(box.top - (y + size), y - box.bottom, 0)
  return Math.hypot(dx, dy)
}

function scatter(width: number, height: number, boxes: Box[], fill: boolean): Piece[] {
  const random = makeRandom(7)
  const wanted = Math.max(6, Math.min(40, Math.round((width * height) / AREA_PER_SKETCH)))
  const pieces: Piece[] = []

  // Tries a number of random spots and keeps the one with the most room around it.
  function addOne(tries: number) {
    let best: Piece | null = null
    let bestGap = -1
    let bestNear: Piece[] = []
    for (let candidate = 0; candidate < tries; candidate++) {
      const size = SIZE_MIN + random() * SIZE_RANGE
      // x may reach half a sketch past either side edge; y stays inside the first screen
      const x = -size / 2 + random() * (width - size) + random() * size
      const y = random() * (height - size)
      if (boxes.some((box) => overlaps(box, x, y, size))) continue
      const apart = pieces.map((other) => ({
        other,
        gap:
          Math.hypot(
            other.x + other.size / 2 - (x + size / 2),
            other.y + other.size / 2 - (y + size / 2),
          ) -
          (other.size + size) / 2,
      }))
      apart.sort((a, b) => a.gap - b.gap)
      let gap = apart.length ? apart[0].gap : Infinity
      // Tall sections: also count the space to the text and cards, so empty corners get filled.
      if (fill) gap = Math.min(gap, ...boxes.map((box) => boxGap(box, x, y, size)))
      if (gap > bestGap) {
        bestGap = gap
        bestNear = apart.slice(0, NEIGHBORS).map((item) => item.other)
        best = { kind: 'cube', x, y, size, turn: (random() - 0.5) * 40 }
      }
    }
    if (!best || bestGap < (fill ? 22 : 10)) return
    // Pick a kind that the nearest neighbors do not have, and that is still rare overall.
    const nearKinds = bestNear.map((other) => other.kind)
    const free = KINDS.filter((kind) => !nearKinds.includes(kind))
    const count = (kind: Kind) => pieces.filter((other) => other.kind === kind).length
    const rarest = Math.min(...free.map(count))
    const choices = free.filter((kind) => count(kind) === rarest)
    best.kind = choices[Math.floor(random() * choices.length)]
    pieces.push(best)
  }

  if (fill) {
    // Keep adding to the biggest empty spot until there is no room left for one more.
    for (let step = 0; step < 40; step++) {
      const before = pieces.length
      addOne(FILL_CANDIDATES)
      if (pieces.length === before) break
    }
    return pieces
  }
  for (let attempt = 0; pieces.length < wanted && attempt < wanted * 40; attempt++) {
    addOne(CANDIDATES)
  }
  // One more sketch, searched much harder, so it lands in the biggest empty spot left.
  addOne(CANDIDATES * 20)
  addOne(CANDIDATES * 60)
  return pieces
}

export default function LandingScatter({ fill = false }: { fill?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [layer, setLayer] = useState({ left: 0, width: 0, height: 0 })

  useLayoutEffect(() => {
    const hero = svgRef.current?.parentElement
    if (!hero) return
    // Runs once at the start and again whenever the first screen changes size.
    const observer = new ResizeObserver(() => {
      const area = hero.getBoundingClientRect()
      // The layer spans the whole window width (even over the browser's small page margin),
      // so a sketch cut at the side is cut exactly at the edge of the window.
      const width = document.documentElement.clientWidth
      const boxes = Array.from(hero.querySelectorAll(KEEP_CLEAR)).map((element) => {
        // A centered heading or paragraph is as wide as its column, but the letters are not,
        // so in the About section measure the text itself and leave the empty sides free.
        let r = element.getBoundingClientRect()
        if (fill && element.matches(TEXT_ONLY)) {
          const range = document.createRange()
          range.selectNodeContents(element)
          r = range.getBoundingClientRect()
        }
        return {
          left: r.left,
          top: r.top - area.top,
          right: r.right,
          bottom: r.bottom - area.top,
        }
      })
      setLayer({ left: -area.left, width, height: area.height })
      setPieces(scatter(width, area.height, boxes, fill))
    })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [fill])

  return (
    <svg
      ref={svgRef}
      className='landing-scatter'
      style={{ left: layer.left }}
      width={layer.width}
      height={layer.height}
      aria-hidden='true'
    >
      {pieces.map((piece, index) => {
        const shape = SHAPES[piece.kind]
        const move = `translate(${piece.x} ${piece.y}) rotate(${piece.turn} ${piece.size / 2} ${piece.size / 2}) scale(${piece.size / 100})`
        return (
          <g key={index} transform={move} fill='none' stroke='#B98A1E' strokeOpacity='0.52'>
            <path d={shape.outline} strokeWidth='3' strokeLinejoin='round' vectorEffect='non-scaling-stroke' />
            <path d={shape.inner} strokeWidth='2.4' strokeLinecap='round' strokeDasharray='2 6' vectorEffect='non-scaling-stroke' />
          </g>
        )
      })}
    </svg>
  )
}