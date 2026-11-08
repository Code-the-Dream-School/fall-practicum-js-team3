import { create } from 'zustand';

export type BlockType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'pyramid' | 'torus';

export interface Block {
  id: number;
  type: BlockType;
  color: string;
  position: { x: number; y: number; z: number };
  scale: number;
}

export interface Design {
  version: 1;
  blocks: Block[];
}

interface DesignState {
  blocks: Block[];
  selectedBlockId: number | null;
  project: { id: string; name: string; userId: string } | null;
  addBlock: (type: BlockType) => void;
  selectBlock: (id: number | null) => void;
  updateColor: (color: string) => void;
  moveBlock: (id: number, position: Block['position']) => void;
  scaleBlock: (id: number, factor: number) => void;
  toJSON: () => Design;
  setProject: (project: { id: string; name: string; userId: string }) => void;
}

const SHAPE_COLORS: Record<BlockType, string> = {
  cube: '#0ea5e9',
  sphere: '#ef4444',
  cylinder: '#10b981',
  cone: '#eab308',
  pyramid: '#a855f7',
  torus: '#f97316',
};

function findFreeSpawnX(blocks: Block[]): number {
  let x = 0;
  while (blocks.some((block) =>
    Math.abs(block.position.x - x) < 1.5 && Math.abs(block.position.z) < 1.5
  )) {
    x += 0.5;
  }
  return x;
}

export const useDesignStore = create<DesignState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  project: null,
  addBlock: (type) => set((state) => {
    let id = Date.now();
    while (state.blocks.some((block) => block.id === id)) id++;
    return {
      blocks: [...state.blocks, {
        id, type, color: SHAPE_COLORS[type],
        position: { x: findFreeSpawnX(state.blocks), y: 0, z: 0 },
        scale: 1,
      }],
      selectedBlockId: id,
    };
  }),
  selectBlock: (id) => set({ selectedBlockId: id }),
  updateColor: (color) => set((state) => ({
    blocks: state.blocks.map((block) =>
      block.id === state.selectedBlockId ? { ...block, color } : block
    ),
  })),
  moveBlock: (id, position) => set((state) => ({
    blocks: state.blocks.map((block) => block.id === id ? { ...block, position } : block),
  })),
  scaleBlock: (id, factor) => set((state) => ({
    blocks: state.blocks.map((block) =>
      block.id === id ? { ...block, scale: Math.min(5, Math.max(0.2, block.scale * factor)) } : block
    ),
  })),
  toJSON: () => ({
    version: 1,
    blocks: get().blocks.map((block) => ({ ...block, position: { ...block.position } })),
  }),
  setProject: (project) => set({ project }),
}));
