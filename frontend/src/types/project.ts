// One project as the API describes it (documentation section 3).
// The list endpoint does not return the shapes, so they are not part of this type.
export interface Project {
  id: string;
  name: string;
  createdAt: string; // ISO 8601 date, e.g. "2026-10-12T18:00:00Z"
  updatedAt: string; // last time the project was saved
}

// What GET /api/projects answers: the projects are wrapped in an object
export interface ProjectListResponse {
  projects: Project[];
}