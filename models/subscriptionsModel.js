import prisma from '../prisma/client.js';
import { PLAN_SELECT } from './plansModel.js';

const SUBSCRIPTION_SELECT = {
  id: true,
  userId: true,
  planId: true,
  status: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  plan: {
    select: PLAN_SELECT,
  },
};

export const findSubscriptionByUserId = async (userId) => {
  return prisma.subscription.findUnique({
    where: { userId },
    select: SUBSCRIPTION_SELECT,
  });
};

export const findActiveSubscriptionByUserId = async (userId) => {
  return prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    select: SUBSCRIPTION_SELECT,
  });
};

export const createSubscription = async ({ userId, planId }) => {
  return prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'active',
      startedAt: new Date(),
    },
    select: SUBSCRIPTION_SELECT,
  });
};