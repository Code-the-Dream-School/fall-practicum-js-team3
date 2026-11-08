import { create } from 'zustand';
import type { Block, BlockType, DesignJson, Project } from '../types/project';

const SHAPE_COLORS: Record<BlockType, string> = {
  cube: '#0ea5e9',
  sphere: '#ef4444',
  cylinder: '#10b981',
  cone: '#eab308',
  pyramid: '#a855f7',
  torus: '#f97316',
};

const SHAPE_HALF_WIDTH: Record<BlockType, number> = {
  cube: 0.5,
  sphere: 0.6,
  cylinder: 0.5,
  cone: 0.6,
  pyramid: 0.7,
  torus: 0.55,
};

const SPAWN_GAP = 0.5;
const MIN_BLOCK_SCALE = 0.2;
const MAX_BLOCK_SCALE = 5;

function findFreeSpawnX(existingBlocks: Block[], newType: BlockType): number {
  let x = 0;
  while (
    existingBlocks.some((block) => {
      const minDistance =
        SHAPE_HALF_WIDTH[block.type] * block.scale + SHAPE_HALF_WIDTH[newType] + SPAWN_GAP;
      return Math.abs(block.position.x - x) < minDistance && Math.abs(block.position.z) < minDistance;
    })
  ) {
    x += 0.5;
  }
  return x;
}

interface StoredProject extends Pick<Project, 'id' | 'name'> {
  userId: string;
}

interface DesignState {
  blocks: Block[];
  selectedBlockId: number | null;
  project: StoredProject | null;
  isDirty: boolean;
  addBlock: (type: BlockType) => void;
  selectBlock: (id: number | null) => void;
  updateSelectedColor: (color: string) => void;
  moveBlock: (id: number, position: Block['position']) => void;
  scaleBlock: (id: number, factor: number) => void;
  rotateBlock: (id: number, rotation: Block['rotation']) => void;
  toJSON: () => DesignJson;
  markSaved: (project: StoredProject) => void;
}

export const useDesignStore = create<DesignState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  project: null,
  isDirty: false,

  addBlock(type) {
    const existingBlocks = get().blocks;
    let id = Date.now();
    while (existingBlocks.some((block) => block.id === id)) id += 1;
    const block: Block = {
      id,
      type,
      color: SHAPE_COLORS[type],
      position: { x: findFreeSpawnX(existingBlocks, type), y: 0, z: 0 },
      scale: 1,
      rotation: { x: 0, y: 0, z: 0 },
    };
    set((state) => ({
      blocks: [...state.blocks, block],
      selectedBlockId: block.id,
      isDirty: true,
    }));
  },

  selectBlock(id) {
    set({ selectedBlockId: id });
  },

  updateSelectedColor(color) {
    const { selectedBlockId } = get();
    if (selectedBlockId === null) return;
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === selectedBlockId ? { ...block, color } : block,
      ),
      isDirty: true,
    }));
  },

  moveBlock(id, position) {
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, position } : block)),
      isDirty: true,
    }));
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
    }));
  },

  rotateBlock(id, rotation) {
    set((state) => ({
      blocks: state.blocks.map((block) => (block.id === id ? { ...block, rotation } : block)),
      isDirty: true,
    }));
  },

  toJSON() {
    return {
      version: 1,
      blocks: get().blocks.map((block) => ({
        ...block,
        position: { ...block.position },
        rotation: { ...block.rotation },
      })),
    };
  },

  markSaved(project) {
    set({ project, isDirty: false });
  },
}));
