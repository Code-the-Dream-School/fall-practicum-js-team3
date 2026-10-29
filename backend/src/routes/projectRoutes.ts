import { Router } from 'express';
import { createProjectHandler, replaceProjectShapesHandler } from '../controllers/projectController';
import { requireAuth } from '../middleware/requireAuth';
import {
	validateCreateProject,
	validateProjectId,
	validateReplaceProjectShapes,
} from '../middleware/projectValidation';

const router = Router();

router.post('/', requireAuth, validateCreateProject, createProjectHandler);
router.put('/:projectId/sceneData', requireAuth, validateProjectId, validateReplaceProjectShapes, replaceProjectShapesHandler);

export default router;