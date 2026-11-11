// One project as returned by create and list endpoints.
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// What GET /api/projects answers: the projects are wrapped in an object.
export interface ProjectListResponse {
  projects: Project[];
}

// The shapes the user built, as produced by the design store's toJSON()
export type BlockType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'pyramid' | 'torus';

export interface Block {
  id: number;
  type: BlockType;
  color: string;
  position: { x: number; y: number; z: number };
  scale: number;
  rotation: { x: number; y: number; z: number };
}

export interface DesignJson {
  version: 1;
  blocks: Block[];
}

// What we send to create a project: the name from the dialog and the current design
export interface CreateProjectPayload {
  name: string;
  design: DesignJson;
}
