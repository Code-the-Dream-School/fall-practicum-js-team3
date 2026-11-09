export const CURRENT_SCHEMA_VERSION = 1;
export const MAX_SHAPES = 500;
export const MAX_SCALE = 1000;
const COORD_LIMIT = 100000;

export const SHAPE_TYPES = ['cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus'] as const;
export type ShapeType = (typeof SHAPE_TYPES)[number];

export interface Vec3 { x: number; y: number; z: number }
export interface Shape {
    id: number;
    type: ShapeType;
    color: string;
    position: Vec3;
    rotation?: Vec3;
    scale: number;
}
export interface Design { schemaVersion: number; shapes: Shape[] }

export type DesignResult =
    | { valid: true }
    | { valid: false; code: 'VALIDATION_ERROR' | 'SHAPE_LIMIT_REACHED'; message: string };

const SHAPE_KEYS = new Set(['id', 'type', 'color', 'position', 'rotation', 'scale']);
const COLOR = /^#[0-9a-fA-F]{6}$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
const isFiniteNumber = (v: unknown): v is number =>
    typeof v === 'number' && Number.isFinite(v);

const VEC3_KEYS = ['x', 'y', 'z']

function checkVec3(v: unknown, path: string): string | null {
  if (!isRecord(v)) return `${path} must be an object with x, y and z.`;
  for (const key of Object.keys(v)) {
    if (!VEC3_KEYS.includes(key)) return `${path}.${key} is not allowed.`;
  }
  for (const axis of VEC3_KEYS) {
    const n = v[axis];
    if (!isFiniteNumber(n) || Math.abs(n) > COORD_LIMIT) {
      return `${path}.${axis} must be a number between -${COORD_LIMIT} and ${COORD_LIMIT}.`;
    }
  }
  return null;
}

function checkShape(s: unknown, path: string, ids: Set<number>): string | null {
    if (!isRecord(s)) return `${path} must be an object.`;
    for (const key of Object.keys(s)) {
        if (!SHAPE_KEYS.has(key)) return `${path}.${key} is not allowed.`;
    }

    const id = s.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
        return `${path}.id must be a positive integer.`;
    }
    if (ids.has(id)) return `${path}.id is a duplicate.`;
    ids.add(id);

    const type = s.type;
    if (typeof type !== 'string' || !(SHAPE_TYPES as readonly string[]).includes(type)) {
        return `${path}.type must be one of: ${SHAPE_TYPES.join(', ')}.`;
    }

    const color = s.color;
    if (typeof color !== 'string' || !COLOR.test(color)) {
        return `${path}.color must look like #RRGGBB.`;
    }

    const positionError = checkVec3(s.position, `${path}.position`);
    if (positionError) return positionError;
    if ((s.position as Vec3).y < 0) return `${path}.position.y must not be below 0.`;

    if (s.rotation !== undefined) {
        const rotationError = checkVec3(s.rotation, `${path}.rotation`);
        if (rotationError) return rotationError;
    }

    const scale = s.scale;
    if (!isFiniteNumber(scale) || scale <= 0 || scale > MAX_SCALE) {
        return `${path}.scale must be a number above 0 and at most ${MAX_SCALE}.`;
    }
    return null;
}

// Returns the first problem found. The message names the field and array position,
// for example "shapes[1].position.y must not be below 0."
export function validateDesign(input: unknown): DesignResult {
    const fail = (
        message: string,
        code: 'VALIDATION_ERROR' | 'SHAPE_LIMIT_REACHED' = 'VALIDATION_ERROR',
    ): DesignResult => ({ valid: false, code, message });

    if (!isRecord(input)) return fail('design must be an object.');
    for (const key of Object.keys(input)) {
        if (key !== 'schemaVersion' && key !== 'shapes') return fail(`design.${key} is not allowed.`);
    }
    if (input.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return fail(`design.schemaVersion must be ${CURRENT_SCHEMA_VERSION}.`);
    }
    const shapes = input.shapes;
    if (!Array.isArray(shapes)) return fail('design.shapes must be an array.');
    if (shapes.length > MAX_SHAPES) {
        return fail(`A project holds at most ${MAX_SHAPES} shapes.`, 'SHAPE_LIMIT_REACHED');
    }

    const ids = new Set<number>();
    for (let i = 0; i < shapes.length; i++) {
        const error = checkShape(shapes[i], `shapes[${i}]`, ids);
        if (error) return fail(error);
    }
    return { valid: true };
}