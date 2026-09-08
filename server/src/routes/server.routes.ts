import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.ts';
import { uploadFile, updateFile, deleteFile, getFiles, getFile } from '../controllers/file.controller.ts';
import { registerValidationRules, authMiddleware } from '../middleware/auth.validation';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

router.post('/register', registerValidationRules, registerUser);
router.post('/login', loginUser);

router.post('/files', authMiddleware, uploadMiddleware.single('file'), uploadFile);
router.put('/files', authMiddleware, uploadMiddleware.single('file'), updateFile);
router.delete('/files/:id', authMiddleware, deleteFile);
router.get('/files', authMiddleware, getFiles);
router.get('/files/:id', authMiddleware, getFile); // api/files/1 for dw, api/files/1?action=view for preview

export default router;
