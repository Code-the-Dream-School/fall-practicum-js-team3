import mongoose, { Schema } from 'mongoose';
import type { DesignBlock } from '../validation/designValidation';
import type { Difficulty } from '../middleware/projectValidation';

// One stored scene item (the published `sceneData_Structure`).
interface SceneItem {
  shapeId: string;
  type: DesignBlock['type'];
  colorHex: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  dimensions?: { w: number; h: number; d: number };
  scale?: number;
  groupId?: string;
}

const sceneDataSchema = new Schema<SceneItem>({
  shapeId: { type: String, required: true, maxlength: 100 },
  type: { type: String, required: true, enum: ['cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus'] },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  rotation: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  colorHex: { type: String, required: true, match: /^#[\da-f]{6}$/i },
  dimensions: {
    w: Number,
    h: Number,
    d: Number,
  },
  scale: Number,
  groupId: { type: String, maxlength: 100 },
}, { _id: false, strict: 'throw' });

const projectSchema = new Schema({
  userId: { type: Schema.Types.UUID, required: true, index: true },
  projectName: { type: String, required: true, trim: true, maxlength: 100 },
  difficulty: { type: String, required: true, enum: ['Brick', 'Builder', 'Engineer'] },
  sceneData: { type: [sceneDataSchema], required: true, default: [] },
  lastSaved: { type: Date },
}, {
  collection: 'projects',
  timestamps: { createdAt: false, updatedAt: false },
  versionKey: false,
  strict: 'throw',
});

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', projectSchema);

// The API shape (doc section 3). Mongo keeps `projectName` and `lastSaved`; `createdAt` is the _id's timestamp.
export interface ProjectRecord {
  id: string;
  name: string;
  difficulty: Difficulty;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDetail extends ProjectRecord {
  design: { version: 1; blocks: DesignBlock[] };
}

export interface NewProject {
  userId: string;
  projectName: string;
  difficulty: Difficulty;
  blocks: DesignBlock[];
}

const toSceneItem = (block: DesignBlock): SceneItem => ({
  shapeId: String(block.id),
  type: block.type,
  colorHex: block.color,
  position: block.position,
  rotation: block.rotation ?? { x: 0, y: 0, z: 0 },
  dimensions: block.dimensions ?? { w: block.scale, h: block.scale, d: block.scale },
  scale: block.scale,
});

interface ProjectMetadata {
  _id: mongoose.Types.ObjectId;
  projectName: string;
  difficulty: Difficulty;
  lastSaved?: Date;
}

const toProjectRecord = (project: ProjectMetadata): ProjectRecord => ({
  id: project._id.toString(),
  name: project.projectName,
  difficulty: project.difficulty,
  createdAt: project._id.getTimestamp(),
  updatedAt: project.lastSaved ?? project._id.getTimestamp(),
});

const toDesignBlock = (item: SceneItem): DesignBlock => {
  const id = Number(item.shapeId);
  const scale = item.scale ?? item.dimensions?.w;
  if (!Number.isSafeInteger(id) || scale === undefined) {
    throw new Error('Stored project contains a shape that cannot be represented as a design block.');
  }
  return {
    id,
    type: item.type,
    color: item.colorHex,
    position: { x: item.position.x, y: item.position.y, z: item.position.z },
    rotation: { x: item.rotation.x, y: item.rotation.y, z: item.rotation.z },
    scale,
    ...(item.dimensions && { dimensions: { w: item.dimensions.w, h: item.dimensions.h, d: item.dimensions.d } }),
  };
};

// An object (not bare functions) so tests can replace `create` without a database.
export const projectRepository = {
  async create(project: NewProject): Promise<ProjectRecord> {
    const created = await ProjectModel.create({
      userId: project.userId,
      projectName: project.projectName,
      difficulty: project.difficulty,
      sceneData: project.blocks.map(toSceneItem),
      lastSaved: new Date(),
    });

    return toProjectRecord(created);
  },

  async list(userId: string): Promise<ProjectRecord[]> {
    const projects = await ProjectModel.find({ userId }).sort({ lastSaved: -1, _id: -1 }).exec();
    return projects.map(toProjectRecord);
  },

  async findById(userId: string, id: string): Promise<ProjectDetail | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const project = await ProjectModel.findOne({ _id: id, userId }).exec();
    if (!project) return null;

    return {
      ...toProjectRecord(project),
      design: {
        version: 1,
        blocks: project.sceneData.map(toDesignBlock),
      },
    };
  },
};
