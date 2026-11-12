
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { deleteProjectController } from '../controllers/projectController';

const router = Router();

// DELETE /api/projects/:projectId
router.delete('/:projectId', requireAuth, deleteProjectController);

export default router;
