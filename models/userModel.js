import prisma from '../prisma/client.js';

const USER_ID_SELECT = {
  id: true,
};

const AUTH_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  password: true,
};

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
};

export const findUserIdByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: USER_ID_SELECT,
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_SELECT,
  });
};

export const findAuthUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: AUTH_USER_SELECT,
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password,
  };
};

export const createUser = async ({ name, email, passwordHash }) => {
  return prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
    },
    select: PUBLIC_USER_SELECT,
  });
};

export const updateUserById = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: PUBLIC_USER_SELECT,
  });
};

export const deleteUserById = async (id) => {
  return prisma.user.delete({
    where: { id },
    select: PUBLIC_USER_SELECT,
  });
};
