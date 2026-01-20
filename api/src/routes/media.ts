import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';

export const mediaRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB para banners
    }
});

// Obtener todos los assets de multimedia
mediaRouter.get('/', async (req, res) => {
  try {
    const assets = await prisma.mediaAsset.findMany({
      orderBy: [
        { type: 'asc' },
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    res.json(assets);
  } catch (err: any) {
    console.error("Error fetching media assets:", err);
    res.status(500).json({ message: "Error fetching media assets", error: err.message });
  }
});

// Obtener assets por tipo
mediaRouter.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const assets = await prisma.mediaAsset.findMany({
      where: { 
        type: type as any,
        isActive: true 
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    res.json(assets);
  } catch (err: any) {
    console.error("Error fetching media assets by type:", err);
    res.status(500).json({ message: "Error fetching media assets", error: err.message });
  }
});

// Obtener asset específico por section
mediaRouter.get('/section/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const asset = await prisma.mediaAsset.findFirst({
      where: { 
        section,
        isActive: true 
      }
    });
    res.json(asset);
  } catch (err: any) {
    console.error("Error fetching media asset by section:", err);
    res.status(500).json({ message: "Error fetching media asset", error: err.message });
  }
});

// Crear o actualizar un asset de multimedia
mediaRouter.post('/', requireAuth, requireRole('ADMIN'), upload.single('image'), async (req, res) => {
  console.log('[MEDIA] Upload request received');
  
  if (!req.file) {
    console.log('[MEDIA] No file provided');
    return res.status(400).json({ message: 'No image provided' });
  }
  
  try {
    const { type, section, title, displayOrder, objectFit, objectPosition } = req.body;
    console.log('[MEDIA] Request data:', { type, section, title, displayOrder, objectFit, objectPosition });
    
    if (!type || !section) {
      console.log('[MEDIA] Missing type or section');
      return res.status(400).json({ message: 'Type and section are required' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `media/${type.toLowerCase()}/${section}-${Date.now()}.${fileExt}`;
    console.log('[MEDIA] Uploading file:', fileName);

    const bucketName = 'ecommerce-products';

    const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (uploadError) {
        console.error("[MEDIA] Supabase Storage Upload Error:", uploadError);
        return res.status(500).json({ message: "Error uploading to storage", error: uploadError.message });
    }

    console.log('[MEDIA] File uploaded successfully');

    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

    console.log('[MEDIA] Public URL:', publicUrl);

    // Buscar si ya existe un asset para esta combinación de tipo y sección
    const existingAsset = await prisma.mediaAsset.findUnique({
      where: {
        type_section: {
          type: type as any,
          section: section
        }
      }
    });

    console.log('[MEDIA] Existing asset:', existingAsset ? 'found' : 'not found');

    let asset;
    if (existingAsset) {
      // Actualizar el asset existente
      asset = await prisma.mediaAsset.update({
        where: { id: existingAsset.id },
        data: {
          url: publicUrl,
          title: title || existingAsset.title,
          displayOrder: displayOrder ? parseInt(displayOrder) : existingAsset.displayOrder,
          objectFit: objectFit || existingAsset.objectFit,
          objectPosition: objectPosition || existingAsset.objectPosition,
          updatedAt: new Date()
        }
      });
      console.log('[MEDIA] Asset updated');
    } else {
      // Crear nuevo asset
      asset = await prisma.mediaAsset.create({
        data: {
          type: type as any,
          section,
          title: title || null,
          url: publicUrl,
          displayOrder: displayOrder ? parseInt(displayOrder) : 0,
          objectFit: objectFit || 'contain',
          objectPosition: objectPosition || 'center',
          isActive: true
        }
      });
      console.log('[MEDIA] Asset created');
    }

    console.log('[MEDIA] Success, returning asset');
    res.json(asset);

  } catch (err: any) {
    console.error("[MEDIA] Upload Error:", err);
    console.error("[MEDIA] Error stack:", err.stack);
    res.status(500).json({ message: "Internal server error during upload", error: err.message, stack: err.stack });
  }
});

// Actualizar un asset (sin cambiar la imagen)
mediaRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, displayOrder, isActive } = req.body;

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        updatedAt: new Date()
      }
    });

    res.json(asset);
  } catch (err: any) {
    console.error("Error updating media asset:", err);
    res.status(500).json({ message: "Error updating media asset", error: err.message });
  }
});

// Eliminar un asset
mediaRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.mediaAsset.delete({
      where: { id }
    });

    res.json({ message: 'Media asset deleted successfully' });
  } catch (err: any) {
    console.error("Error deleting media asset:", err);
    res.status(500).json({ message: "Error deleting media asset", error: err.message });
  }
});
