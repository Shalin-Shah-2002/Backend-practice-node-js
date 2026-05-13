// User controller – handles business logic for user routes using Prisma

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';

// Register (signup) – create user with hashed password
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashed } });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all users
export const getAllUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a user by ID
export const updateUser = async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(updatedUser);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(400).json({ error: err.message });
  }
};

// Delete a user by ID
export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: err.message });
  }
};
