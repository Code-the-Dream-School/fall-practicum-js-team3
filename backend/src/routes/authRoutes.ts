import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser
} from "../controllers/authController";
import { validateLoginBody } from "../middleware/authValidation";

const router = Router();

// POST /api/auth/login
router.post("/login", validateLoginBody, loginUser);

// POST /api/auth/logout
router.post("/logout", logoutUser);

router.post("/register", registerUser);

export default router;
