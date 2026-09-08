import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomUUID();;
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

export const uploadMiddleware = multer({ storage });