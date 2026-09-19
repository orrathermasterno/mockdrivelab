import express, { type Request, type Response } from 'express';
import { type AuthRequest } from "../middleware/auth.validation.ts";
import { getFileHash } from "../utils/hash"
import path from 'path';
import fs from 'fs';
import { db } from "../prisma/db";
import { Temporal } from 'temporal-polyfill';

export async function getFiles(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    
    try {
        const files = await db.orm.public.File
            .where({ownerId: userId })
            .include("uploader")
            .include("editor")
            .all();

        res.status(200).json({ files });
    } catch(err) {
        res.status(500).json({ message: 'Error fetching files' });
    }
}

export async function getFile(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id as string, 10);

    if (isNaN(fileId)) {
        return res.status(400).json({ message: 'Invalid file ID format' });
    }

    try {
        const existingFile = await db.orm.public.File.first({
            ownerId: userId,
            id: fileId
        });

        if (!existingFile) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(process.cwd(), 'uploads', existingFile.storageKey);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        const originalName = `${existingFile.title}${existingFile.extension}`;

        if (req.query.action === 'download') {
            return res.download(filePath, originalName);
        } else {
            return res.sendFile(filePath);
        }

    } catch (err) {
        res.status(500).json({ message: 'Error retrieving file' });
    }
}

export async function uploadFile(req: AuthRequest, res: Response) {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const userId = req.user!.id;
    const { originalname, size, filename, path: filePath } = req.file;
    const extension = path.extname(originalname);
    const title = path.basename(originalname, extension);

    try {

        const existingFile = await db.orm.public.File.first({
            ownerId: userId,
            title: title,
            extension: extension
        });

        if (existingFile) {
            fs.unlinkSync(filePath); 
            
            return res.status(409).json({ 
                message: 'A file with this name already exists' 
            });
        }

        const fileRecord = await db.orm.public.File.create({
            title,
            extension,
            storageKey: filename,
            size,
            sha256: Buffer.from(getFileHash(filePath), 'hex'),
            ownerId: userId,
            uploaderId: userId,
        });

        res.status(201).json({ message: 'File uploaded', file: fileRecord });
    } catch (err) {
        fs.unlinkSync(filePath);
        res.status(500).json({ message: 'Error uploading file' });
    }
}

export const updateFile = async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const userId = req.user!.id;
    const extension = path.extname(req.file.originalname);
    const title = path.basename(req.file.originalname, extension);

    try {
        const existingFile = await db.orm.public.File.where({ ownerId: userId, title: title, extension: extension }).first();

        if (!existingFile) {
            fs.unlinkSync(req.file.path); // destr file stored by middlew
            return res.status(404).json({ message: 'File not found' });
        }

        const newHash = Buffer.from(getFileHash(req.file.path), 'hex');
        if (Buffer.from(existingFile.sha256).equals(newHash)) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(200).json({ message: 'File up to date' });
        }

        const filePath = path.join(process.cwd(), 'uploads', existingFile.storageKey);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        const updatedFile = await db.orm.public.File
            .where({ id: existingFile.id })
            .update({
                storageKey: req.file.filename,
                size: req.file.size,
                sha256: newHash,
                editorId: userId,
                updatedAt: Temporal.Now.instant() as any
            });

        res.status(200).json({ message: 'File updated', file: updatedFile });
    } catch (err) {
        console.error("Update failed:", err);
        // if (req.file && fs.existsSync(req.file.path)) {
        //     fs.unlinkSync(req.file.path);
        // }
        res.status(500).json({ message: 'Error updating file' });
    }
};

export async function deleteFile(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const fileId = parseInt(req.params.id as string, 10);

    if (isNaN(fileId)) {
        return res.status(400).json({ message: 'Invalid file id format' });
    }

    try {
        const existingFile = await db.orm.public.File.first({
            ownerId: userId,
            id: fileId
        });

        if (!existingFile) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(process.cwd(), 'uploads', existingFile.storageKey);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db.orm.public.File
            .where({ ownerId: userId, id: fileId })
            .delete();

        res.status(200).json({ message: 'File deleted' })

    } catch (err) {
        res.status(500).json({ message: 'Error deleting file' });
    }
}