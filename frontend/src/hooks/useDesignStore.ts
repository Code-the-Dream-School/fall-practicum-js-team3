/*
  Design store: the shapes the user is building, and the project they were saved as.

  What it holds:
  - blocks: every shape in the scene
  - selectedBlockId: the shape that is selected, or null
  - project: the id and name returned by the server after a save, or null before the first one
    (kept so later saves can update the same project)
  - isDirty: true when the design changed since it was last saved

  toJSON() returns the design in the form that is sent to the server.
*/
import { create } from 'zustand'
import type { Block, BlockType, DesignJson, Project } from '../types/project'

const SHAPE_COLORS: Record<BlockType, string> = {
  cube: '#0ea5e9',
  sphere: '#ef4444',
  cylinder: '#10b981',
  cone: '#eab308',
  pyramid: '#a855f7',
  torus: '#f97316',
}

// Smallest and largest size a shape can have (1 = original size).
const MIN_BLOCK_SCALE = 0.2
const MAX_BLOCK_SCALE = 5

// Find the first empty spot in the row, so a new shape never lands inside another one.
function findFreeSpawnX(existingBlocks: Block[]): number {
  let x = 0
  while (
    existingBlocks.some(
      (block) => Math.abs(block.position.x - x) < 1.5 && Math.abs(block.position.z) < 1.5,
    )
  ) {
    x += 0.5
  }
  return x
}

interface DesignState {
  blocks: Block[]
  selectedBlockId: number | null
  project: Pick<Project, 'id' | 'name'> | null
  isDirty: boolean
  addBlock: (type: BlockType) => void
  selectBlock: (id: number | null) => void
  updateSelectedColor: (color: string) => void
  moveBlock: (id: number, position: Block['position']) => void
  scaleBlock: (id: number, factor: number) => void
  toJSON: () => DesignJson
  markSaved: (project: Pick<Project, 'id' | 'name'>) => void
}

export const useDesignStore = create<DesignState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  project: null,
  isDirty: false,

  addBlock(type) {
    const block: Block = {
      id: Date.now(),
      type,
      color: SHAPE_COLORS[type],
      position: { x: findFreeSpawnX(get().blocks), y: 0, z: 0 },
      scale: 1,
    }
    set((state) => ({ blocks: [...state.blocks, block], selectedBlockId: block.id, isDirty: true }))
  },

  selectBlock(id) {
    set({ selectedBlockId: id })
  },

  updateSelectedColor(color) {
    const { selectedBlockId } = get()
    if (selectedBlockId === null) return
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === selectedBlockId ? { ...block, color } : block,
      ),
      isDirty: true,
    }))
  },

  moveBlock(id, position) {
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, position } : block)),
      isDirty: true,
    }))
  },

  scaleBlock(id, factor) {
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id
          ? {
              ...block,
              scale: Math.min(MAX_BLOCK_SCALE, Math.max(MIN_BLOCK_SCALE, block.scale * factor)),
            }
          : block,
      ),
      isDirty: true,
    }))
  },

  toJSON() {
    return { version: 1, blocks: get().blocks }
  },

  markSaved(project) {
    set({ project: { id: project.id, name: project.name }, isDirty: false })
  },
}))
