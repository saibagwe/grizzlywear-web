import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { syncUser } from '../controllers/userController.js';

const router = Router();

// POST /api/auth/sync — sync/create user on login
router.post('/sync', verifyFirebaseToken, syncUser);

export default router;
