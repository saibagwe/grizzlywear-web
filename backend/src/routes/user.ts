import express, { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/userController.js';

const router: express.Router = Router();

// All user routes require authentication
router.use(verifyFirebaseToken);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Addresses
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
