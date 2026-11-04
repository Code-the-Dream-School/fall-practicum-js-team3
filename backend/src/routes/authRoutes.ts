import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser } from '../controllers/authController';
import { validateLoginBody } from '../middleware/authValidation';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// POST /api/auth/login
router.post('/login', validateLoginBody, loginUser);

// POST /api/auth/logout
router.post('/logout', requireAuth, logoutUser);

// GET /api/auth/user
router.get('/user', requireAuth, getCurrentUser);

export default router;
