import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../controllers/authController';
import { validateLoginBody, validateRegisterBody } from '../middleware/authValidation';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegisterBody, registerUser);

// POST /api/auth/login
router.post('/login', validateLoginBody, loginUser);

// POST /api/auth/logout
router.post('/logout', requireAuth, logoutUser);

// GET /api/auth/user
router.get('/user', requireAuth, getCurrentUser);

export default router;
