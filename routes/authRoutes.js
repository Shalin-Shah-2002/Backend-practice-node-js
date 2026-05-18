import express from 'express';
import { login, register } from '../controllers/authController.js';

const router = express.Router();

// Register endpoint – creates user and returns JWT
router.post('/register', register);

// Login endpoint – returns JWT on success
router.post('/login', login);

export default router;
