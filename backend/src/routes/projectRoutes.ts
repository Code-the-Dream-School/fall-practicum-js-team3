import { Router } from 'express';
import { createProjectHandler } from '../controllers/projectController';
import { validateCreateProject } from '../middleware/projectValidation';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// POST /api/projects
router.post('/', requireAuth, validateCreateProject, createProjectHandler);

export default router;
