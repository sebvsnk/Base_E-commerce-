import { Router } from 'express';
import { upload } from '../lib/cloudinary';
import { requireAuth, requireRole } from '../middleware/auth';

export const uploadRouter = Router();

uploadRouter.post('/', requireAuth, requireRole('ADMIN', 'WORKER'), (req, res, next) => {
    upload.single('image')(req, res, (err: any) => {
        if (err) {
            console.error("Cloudinary Upload Error:", err);
            return res.status(500).json({ message: "Error subiendo imagen", error: err.message });
        }
        next();
    });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image provided' });
  }
  
  res.json({ url: req.file.path });
});
