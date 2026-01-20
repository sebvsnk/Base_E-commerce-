import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';

export const uploadRouter = Router();

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

uploadRouter.post('/', requireAuth, requireRole('ADMIN', 'WORKER'), upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image provided' });
  }
  
  try {
    const file = req.file;
    // Generate a unique filename using timestamp and random string
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = fileName;

    const bucketName = 'ecommerce-products'; // Ensure this bucket exists in your Supabase project and is Public

    const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        console.error("Supabase Storage Upload Error:", error);
        return res.status(500).json({ message: "Error uploading to storage", error: error.message });
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    res.json({ url: publicUrl });

  } catch (err: any) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Internal server error during upload", error: err.message });
  }
});
