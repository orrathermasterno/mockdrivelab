import { body } from 'express-validator';
import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: number };
}

export const registerValidationRules = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const authMiddleware = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!);
    req.user = decoded as { id: number };
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};