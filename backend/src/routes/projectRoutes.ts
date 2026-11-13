import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validateCreateProjectBody } from '../middleware/projectValidation';
import { makeCreateProjectHandler } from '../controllers/projectController';
import type { ProjectSummary } from '../repositories/projectRepository';
import type { CreateProjectBody } from '../middleware/projectValidation';

type CreateProject = (owner: unknown, input: CreateProjectBody) => Promise<ProjectSummary>;

export const makeProjectRouter = (create?: CreateProject) => {
  const router = Router();
  router.post('/', requireAuth, validateCreateProjectBody, makeCreateProjectHandler(create));
  return router;
};

export default makeProjectRouter();
