import mongoose, { Schema } from 'mongoose';
import type { CreateProjectBody, ProjectBlock } from '../middleware/projectValidation';

const sceneDataSchema = new Schema<ProjectBlock>({
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

export interface ProjectRecord {
  id: string;
  projectName: string;
  difficulty: CreateProjectBody['difficulty'];
  lastSaved: Date | null;
}

const toProjectRecord = (project: { _id: mongoose.Types.ObjectId; projectName: string; difficulty: CreateProjectBody['difficulty']; lastSaved?: Date }): ProjectRecord => ({
  id: project._id.toString(),
  projectName: project.projectName,
  difficulty: project.difficulty,
  lastSaved: project.lastSaved ?? null,
});

export const createProject = async (userId: string, project: CreateProjectBody): Promise<ProjectRecord> => {
  const created = await ProjectModel.create({
    userId,
    projectName: project.projectName,
    difficulty: project.difficulty,
    sceneData: [],
  });
  return toProjectRecord(created);
};

export const replaceProjectScene = async (
  userId: string,
  projectId: string,
  sceneData: ProjectBlock[],
): Promise<ProjectRecord | null> => {
  const updated = await ProjectModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(projectId), userId },
    { $set: { sceneData, lastSaved: new Date() } },
    { new: true, runValidators: true },
  ).exec();

  return updated ? toProjectRecord(updated) : null;
};