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

export interface NewProject {
  userId: string;
  projectName: string;
  difficulty: Difficulty;
  blocks: DesignBlock[];
}

// The editor has no rotation or per-axis size yet, so rotation is 0 and scale fills `dimensions`.
const toSceneItem = (block: DesignBlock): SceneItem => ({
  shapeId: String(block.id),
  type: block.type,
  colorHex: block.color,
  position: block.position,
  rotation: { x: 0, y: 0, z: 0 },
  dimensions: { w: block.scale, h: block.scale, d: block.scale },
});

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

    return {
      id: created._id.toString(),
      name: created.projectName,
      difficulty: created.difficulty,
      createdAt: created._id.getTimestamp(),
      updatedAt: created.lastSaved ?? created._id.getTimestamp(),
    };
  },
};
