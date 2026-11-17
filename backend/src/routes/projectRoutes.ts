import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validateCreateProjectBody } from '../middleware/projectValidation';
import { makeCreateProjectHandler, deleteProjectController, getProjectsController, } from '../controllers/projectController';
import type { ProjectSummary } from '../repositories/projectRepository';
import type { CreateProjectBody } from '../middleware/projectValidation';

type CreateProject = (owner: unknown, input: CreateProjectBody) => Promise<ProjectSummary>;

export const makeProjectRouter = (create?: CreateProject) => {
  const router = Router();

// GET 
  router.get('/', requireAuth, getProjectsController);

//POST
  router.post('/', requireAuth, validateCreateProjectBody, makeCreateProjectHandler(create));

// DELETE
  router.delete('/:projectId', requireAuth, deleteProjectController);

    return router;
};
export default makeProjectRouter();

