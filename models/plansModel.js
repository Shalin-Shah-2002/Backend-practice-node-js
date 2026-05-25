import prisma from '../prisma/client.js';

const DEFAULT_PLANS = [
  {
    sortOrder: 1,
    slug: 'free',
    name: 'Free',
    description: 'Starter plan for learning and small projects',
    monthlyPriceCents: 0,
    apiCallLimit: 1000,
    storageLimitGb: 5,
    isActive: true,
  },
  {
    sortOrder: 2,
    slug: 'pro',
    name: 'Pro',
    description: 'Higher limits for growing products',
    monthlyPriceCents: 1500,
    apiCallLimit: 50000,
    storageLimitGb: 100,
    isActive: true,
  },
  {
    sortOrder: 3,
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Custom scale and support for larger teams',
    monthlyPriceCents: 5000,
    apiCallLimit: null,
    storageLimitGb: null,
    isActive: true,
  },
];

const PLAN_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  monthlyPriceCents: true,
  apiCallLimit: true,
  storageLimitGb: true,
};

export { PLAN_SELECT };

export const ensureDefaultPlans = async () => {
  await Promise.all(
    DEFAULT_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: plan,
        select: PLAN_SELECT,
      }),
    ),
  );
};

export const findAllPlans = async () => {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: PLAN_SELECT,
  });
};

export const findPlanById = async (id) => {
  return prisma.plan.findFirst({
    where: { id, isActive: true },
    select: PLAN_SELECT,
  });
};