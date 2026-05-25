import { ensureDefaultPlans, findAllPlans, findPlanById } from '../models/plansModel.js';

const parsePlanId = (value) => {
  const planId = Number(value);
  return Number.isInteger(planId) && planId > 0 ? planId : null;
};

export const getPlans = async (_req, res) => {
  try {
    await ensureDefaultPlans();
    const plans = await findAllPlans();
    return res.json(plans);
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const planId = parsePlanId(req.params.id);
    if (!planId) {
      return res.status(400).json({ error: 'Invalid plan id' });
    }

    await ensureDefaultPlans();
    const plan = await findPlanById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    return res.json(plan);
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};