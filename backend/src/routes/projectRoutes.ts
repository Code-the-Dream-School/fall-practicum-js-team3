import { Router } from 'express';
import { createProjectHandler, getProjectHandler, listProjectsHandler } from '../controllers/projectController';
import { validateCreateProject } from '../middleware/projectValidation';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// POST /api/projects
router.post('/', requireAuth, validateCreateProject, createProjectHandler);
router.get('/', requireAuth, listProjectsHandler);
router.get('/:projectId', requireAuth, getProjectHandler);

export default router;
