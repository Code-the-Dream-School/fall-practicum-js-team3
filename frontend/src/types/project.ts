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

// One project with its saved shapes, as returned by GET /api/projects/:id.
export interface ProjectWithDesign extends Project {
  design: SavedDesignJson;
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

// Older saved projects can omit rotation; the editor fills it in on load.
export interface SavedDesignJson {
  version: 1;
  blocks: (Omit<Block, 'rotation'> & { rotation?: Block['rotation'] })[];
}

// What we send to create a project: the name from the dialog and the current design
export interface CreateProjectPayload {
  name: string;
  design: DesignJson;
}
