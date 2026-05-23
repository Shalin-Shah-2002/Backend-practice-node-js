/*
Auth controller business logic, step by step:
1. Register a new user with validation, uniqueness checks, password hashing, and JWT issuance.
2. Log a user in by validating email/password and comparing the stored password hash.
3. Return only public user fields in auth responses so password data never leaves the API.
*/

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findAuthUserByEmail, findUserIdByEmail } from '../models/userModel.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 255;
const SALT_ROUNDS = 12;

const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeName = (name) => name.trim().replace(/\s+/g, ' ');

const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  return jwtSecret || null;
};

const getAuthToken = (userId, jwtSecret) => {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: '1h' });
};

const isStrongPassword = (password) =>
  password.length >= MIN_PASSWORD_LENGTH &&
  password.length <= MAX_PASSWORD_LENGTH &&
  PASSWORD_STRENGTH_REGEX.test(password);

const toAuthResponse = (user, token) => ({
  token,
  user: { id: user.id, name: user.name, email: user.email },
});

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (normalizedName.length < MIN_NAME_LENGTH || normalizedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: 'Name must be between 2 and 255 characters' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({ error: 'Password must be 8-72 chars with upper, lower, number, and symbol' });
    }

    const existingUser = await findUserIdByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashedPassword,
    });

    const token = getAuthToken(user.id, jwtSecret);
    return res.status(201).json(toAuthResponse(user, token));
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await findAuthUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = getAuthToken(user.id, jwtSecret);
    return res.json(toAuthResponse(user, token));
  } catch (_err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
