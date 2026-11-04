// Shared check for a design sent by the frontend ({ version: 1, blocks: [...] }).
// Returns the cleaned blocks, or a message that names the invalid field and its position.

export const BLOCK_TYPES = ['cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const MAX_BLOCKS = 500;
const MAX_COORDINATE = 1_000_000;
const MAX_SCALE = 1000;

export interface DesignBlock {
  id: number;
  type: BlockType;
  color: string;
  position: { x: number; y: number; z: number };
  scale: number;
}

export type DesignResult =
  | { ok: true; blocks: DesignBlock[] }
  | { ok: false; reason: 'invalid' | 'too_many'; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_COORDINATE;

const invalid = (message: string): DesignResult => ({ ok: false, reason: 'invalid', message });

export const validateDesign = (design: unknown): DesignResult => {
  if (!isRecord(design)) return invalid('design must be an object.');
  if (design.version !== 1) return invalid('design.version must be 1.');
  if (!Array.isArray(design.blocks)) return invalid('design.blocks must be an array.');

  if (design.blocks.length > MAX_BLOCKS) {
    return {
      ok: false,
      reason: 'too_many',
      message: `A project can contain at most ${MAX_BLOCKS} shapes.`,
    };
  }

  const blocks: DesignBlock[] = [];
  const seenIds = new Set<number>();

  for (const [index, raw] of design.blocks.entries()) {
    const path = `design.blocks[${index}]`;
    if (!isRecord(raw)) return invalid(`${path} must be an object.`);

    const { id, type, color, position, scale } = raw;
    if (typeof id !== 'number' || !Number.isSafeInteger(id)) {
      return invalid(`${path}.id must be an integer.`);
    }
    if (seenIds.has(id)) return invalid(`${path}.id is a duplicate.`);
    seenIds.add(id);

    if (typeof type !== 'string' || !BLOCK_TYPES.includes(type as BlockType)) {
      return invalid(`${path}.type must be one of: ${BLOCK_TYPES.join(', ')}.`);
    }
    if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) {
      return invalid(`${path}.color must be a hex color like #RRGGBB.`);
    }
    if (!isRecord(position)) return invalid(`${path}.position must be an object.`);
    for (const axis of ['x', 'y', 'z'] as const) {
      if (!isCoordinate(position[axis])) {
        return invalid(`${path}.position.${axis} must be a number between -1000000 and 1000000.`);
      }
    }
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale <= 0 || scale > MAX_SCALE) {
      return invalid(`${path}.scale must be greater than 0 and at most ${MAX_SCALE}.`);
    }

    blocks.push({
      id,
      type: type as BlockType,
      color,
      position: {
        x: position.x as number,
        y: position.y as number,
        z: position.z as number,
      },
      scale,
    });
  }

  return { ok: true, blocks };
};
