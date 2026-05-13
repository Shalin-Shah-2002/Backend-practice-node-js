import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

// Login endpoint – returns JWT on success
router.post('/login', login);

export default router;
