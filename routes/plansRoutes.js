import express from 'express';

import { getPlanById, getPlans } from '../controllers/plansController.js';

const router = express.Router();

router.get('/', getPlans);
router.get('/:id', getPlanById);

export default router; 