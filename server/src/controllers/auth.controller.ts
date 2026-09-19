import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { db } from "../prisma/db";
import jwt from 'jsonwebtoken';

export async function registerUser(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;


    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPasswordBytes = Buffer.from(hashedPassword, 'utf8');

        await db.orm.public.User.create({
            email: email,
            name: username,
            passwordHash: hashedPasswordBytes,
        });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        res.status(500).json({ 
            message: 'Error registering user', 
            error: errorMessage 
        });
    }
}

export async function loginUser(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
        const user = await db.orm.public.User
            .where({ email: email })
            .first();
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const hashString = Buffer.from(user.passwordHash).toString('utf8');
        const isMatch = await bcrypt.compare(password, hashString);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env['JWT_SECRET']!, { expiresIn: '10h' });
        res.status(200).json({ token, message: 'Logged in successfully' });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        res.status(500).json({ 
            message: 'Error logging in', 
            error: errorMessage 
        });
    }
}