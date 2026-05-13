import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
	register,
	getAllUsers,
	getUserById,
	updateUser,
	deleteUser,
} from '../controllers/userController.js';

const router = express.Router();


// Register (signup) – open endpoint (no auth)
router.post('/register', register);

// Protect all routes after registration
router.use(authenticateToken); // protect subsequent routes

router.get('/', getAllUsers);

// Get a specific user
router.get('/:id', getUserById);

// Update a user
router.put('/:id', updateUser);

// Delete a user
router.delete('/:id', deleteUser);

export default router;

