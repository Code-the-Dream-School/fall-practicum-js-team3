import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { ApiError } from '../errors/ApiError';
import {
    validateDesign,
    CURRENT_SCHEMA_VERSION,
    type Design,
} from '../validation/projectDesign';

const NAME_MAX_LENGTH = 100;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SORT_FIELDS = ['name', 'createdAt', 'updatedAt'];

export interface ProjectSummary {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectView extends ProjectSummary {
    design: Design;
}

export interface ListOptions {
    search?: string;
    limit?: number;
    offset?: number;
    sort?: string; // "name", "createdAt" or "updatedAt"; a leading "-" reverses the order
}

export interface ProjectInput {
    name?: unknown;
    design?: unknown;
}

// Owner is left out on purpose, so it can't leak into API responses.
interface ProjectRecord {
    _id: { toString(): string };
    name: string;
    design?: unknown;
    createdAt: Date;
    updatedAt: Date;
}

// ---- helpers ----

function validationError(message: string): ApiError {
    return new ApiError(422, 'VALIDATION_ERROR', message);
}

// The owner comes from the login token, never the request, so a bad value is our bug (500).
// Rejecting objects also blocks injection like { $ne: null }.
function assertOwner(owner: unknown): asserts owner is string {
    if (typeof owner !== 'string' || owner.length === 0) {
        throw new Error('owner must be a non-empty string');
    }
}

function cleanName(name: unknown): string {
    if (typeof name !== 'string') throw validationError('name must be a string.');
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > NAME_MAX_LENGTH) {
        throw validationError(`name must be 1 to ${NAME_MAX_LENGTH} characters.`);
    }
    return trimmed;
}

function assertValidDesign(design: unknown): asserts design is Design {
    const result = validateDesign(design);
    if (!result.valid) {
        const status = result.code === 'SHAPE_LIMIT_REACHED' ? 409 : 422;
        throw new ApiError(status, result.code, result.message);
    }
}

// Search text is treated as plain text, so ".*" can't match everything or run a slow pattern.
function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(owner: string, search?: string) {
    const filter: Record<string, unknown> = { owner };
    const term = typeof search === 'string' ? search.trim() : '';
    if (term) {
        filter.name = { $regex: escapeRegex(term), $options: 'i' };
    }
    return filter;
}

function parseSort(sort: string): { field: string; direction: 1 | -1 } {
    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    if (!SORT_FIELDS.includes(field)) {
        throw validationError('sort must be name, createdAt or updatedAt, with an optional leading "-".');
    }
    return { field, direction: descending ? -1 : 1 };
}

function toSummary(record: ProjectRecord): ProjectSummary {
    return {
        id: record._id.toString(),
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

// blocks are free-form in MongoDB. This trusts what was saved; 
// records edited by hand or from older versions aren't re-checked.
function toProject(record: ProjectRecord): ProjectView {
    const emptyDesign: Design = { version: CURRENT_SCHEMA_VERSION, blocks: [] };
    return { ...toSummary(record), design: (record.design ?? emptyDesign) as Design };
}

// ---- data access ----

export async function createProject(owner: unknown, input: ProjectInput = {}): Promise<ProjectView> {
    assertOwner(owner);
    const name = cleanName(input.name);
    // A new project may start with an empty canvas.
    const design = input.design ?? { version: CURRENT_SCHEMA_VERSION, blocks: [] };
    assertValidDesign(design);

    const record = await Project.create({ owner, name, design });
    return toProject(record);
}

export async function listProjects(owner: unknown, options: ListOptions = {}) {
    assertOwner(owner);
    const { search, limit = DEFAULT_LIMIT, offset = 0, sort = '-updatedAt' } = options;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
        throw validationError(`limit must be a whole number from 1 to ${MAX_LIMIT}.`);
    }
    if (!Number.isInteger(offset) || offset < 0) {
        throw validationError('offset must be 0 or greater.');
    }
    const { field, direction } = parseSort(sort);
    const filter = buildFilter(owner, search);

    const [records, total] = await Promise.all([
        Project.find(filter)
            .select('-design') // the library only needs names and dates, so skip the blocks
            .sort({ [field]: direction, _id: direction }) // _id breaks ties so paging stays stable
            .skip(offset)
            .limit(limit)
            .lean(),
        Project.countDocuments(filter),
    ]);

    return { projects: records.map(toSummary), pagination: { total, limit, offset } };
}

// null covers "missing" and "not yours" alike; routes answer 404 for both.
export async function getProject(owner: unknown, id: unknown): Promise<ProjectView | null> {
    assertOwner(owner);
    if (!mongoose.isObjectIdOrHexString(id)) return null;

    const record = await Project.findOne({ _id: id, owner }).lean();
    return record ? toProject(record) : null;
}

export async function updateProject(
    owner: unknown,
    id: unknown,
    patch: ProjectInput = {},
): Promise<ProjectView | null> {
    assertOwner(owner);
    if (!mongoose.isObjectIdOrHexString(id)) return null;

    const changes: Record<string, unknown> = {};
    if (patch.name !== undefined) changes.name = cleanName(patch.name);
    if (patch.design !== undefined) {
        assertValidDesign(patch.design);
        changes.design = patch.design;
    }
    if (Object.keys(changes).length === 0) return getProject(owner, id);

    const record = await Project.findOneAndUpdate(
        { _id: id, owner }, // owner in the filter stops one user editing another's project
        { $set: changes },
        { new: true },
    ).lean();
    return record ? toProject(record) : null;
}