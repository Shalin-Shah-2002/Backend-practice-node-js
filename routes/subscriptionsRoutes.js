import express from 'express';

import { getMySubscription, postSubscription } from '../controllers/subscriptionsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticateToken, getMySubscription);
router.post('/', authenticateToken, postSubscription);

export default router;