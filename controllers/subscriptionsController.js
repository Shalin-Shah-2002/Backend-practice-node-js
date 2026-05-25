import { ensureDefaultPlans, findPlanById } from '../models/plansModel.js';
import {
  createSubscription,
  findActiveSubscriptionByUserId,
  findSubscriptionByUserId,
} from '../models/subscriptionsModel.js';

const parsePlanId = (value) => {
  const planId = Number(value);
  return Number.isInteger(planId) && planId > 0 ? planId : null;
};

const parseUserId = (value) => {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

export const postSubscription = async (req, res) => {
  try {
    const userId = parseUserId(req.user?.id);
    if (!userId) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const { planId } = req.body ?? {};
    const parsedPlanId = parsePlanId(planId);
    if (!parsedPlanId) {
      return res.status(400).json({ error: 'planId must be a positive integer' });
    }

    await ensureDefaultPlans();

    const plan = await findPlanById(parsedPlanId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const existingSubscription = await findSubscriptionByUserId(userId);
    if (existingSubscription) {
      return res.status(409).json({ error: 'User already has an active subscription' });
    }

    const subscription = await createSubscription({ userId, planId: parsedPlanId });
    return res.status(201).json(subscription);
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'User already has an active subscription' });
    }

    if (err?.code === 'P2003') {
      return res.status(404).json({ error: 'Plan not found' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const userId = parseUserId(req.user?.id);
    if (!userId) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const subscription = await findActiveSubscriptionByUserId(userId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.json(subscription);
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};