/*
User controller business logic, step by step:
1. Protect public user reads behind JWT authentication.
2. Normalize names and emails before they reach the database.
3. Hash passwords with bcrypt so plain text never gets persisted.
4. Require JWT ownership for update and delete routes.
5. Return only public user fields so password data never leaves the API.
*/

import bcrypt from 'bcrypt';

import {
  deleteUserById,
  findAllUsers,
  findUserById,
  findUserIdByEmail,
  updateUserById,
} from '../models/userModel.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 255;
const SALT_ROUNDS = 12;

const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeName = (name) => name.trim().replace(/\s+/g, ' ');

const isStrongPassword = (password) =>
  password.length >= MIN_PASSWORD_LENGTH &&
  password.length <= MAX_PASSWORD_LENGTH &&
  PASSWORD_STRENGTH_REGEX.test(password);

const parseUserId = (value) => {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

const ensureSelfAccess = (req, res, userId) => {
  const authedUserId = Number(req.user?.id);
  if (authedUserId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  return true;
};

export const getUsers = async (_req, res) => {
  try {
    const users = await findAllUsers();
    return res.json(users);
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req, res) => {
  // Read profile flow:
  // 1. Parse the route id.
  // 2. Load the public user record.
  // 3. Return 404 if the profile no longer exists.
  try {
    const userId = parseUserId(req.params.id);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  // Update profile flow:
  // 1. Parse and authorize the route id.
  // 2. Validate only the fields the client sent.
  // 3. Check email uniqueness before changing it.
  // 4. Hash a new password before saving it.
  // 5. Persist the public profile changes and return the updated record.
  try {
    const userId = parseUserId(req.params.id);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (!ensureSelfAccess(req, res, userId)) {
      return;
    }

    const { name, email, password } = req.body ?? {};
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({ error: 'Name must be a string' });
      }

      const normalizedName = normalizeName(name);
      if (normalizedName.length < MIN_NAME_LENGTH || normalizedName.length > MAX_NAME_LENGTH) {
        return res.status(400).json({ error: 'Name must be between 2 and 255 characters' });
      }

      updates.name = normalizedName;
    }

    if (email !== undefined) {
      if (typeof email !== 'string') {
        return res.status(400).json({ error: 'Email must be a string' });
      }

      const normalizedEmail = normalizeEmail(email);
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const existingUser = await findUserIdByEmail(normalizedEmail);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      updates.email = normalizedEmail;
    }

    if (password !== undefined) {
      if (typeof password !== 'string') {
        return res.status(400).json({ error: 'Password must be a string' });
      }

      if (!isStrongPassword(password)) {
        return res
          .status(400)
          .json({ error: 'Password must be 8-72 chars with upper, lower, number, and symbol' });
      }

      updates.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one field is required to update user' });
    }

    const user = await updateUserById(userId, updates);
    return res.json(user);
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  // Delete profile flow:
  // 1. Parse and authorize the route id.
  // 2. Delete the matching account.
  // 3. Return a confirmation message.
  // 4. Surface 404 if the record is already gone.
  try {
    const userId = parseUserId(req.params.id);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (!ensureSelfAccess(req, res, userId)) {
      return;
    }

    await deleteUserById(userId);
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};