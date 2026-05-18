import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path
      .basename(file.originalname || 'product', ext)
      .replace(/[^a-z0-9-]/gi, '-')
      .toLowerCase();

    cb(null, `${safeBase}-${Date.now()}${ext || '.jpg'}`);
  }
});

function fileFilter(_req, file, cb) {
  const field = String(file.fieldname || '').toLowerCase();
  const type = String(file.mimetype || '').toLowerCase();
  const isImageField = field === 'image' || field === 'images';
  const isPdfField = field === 'specpdf';

  if (isImageField) {
    if (type === 'image/jpeg' || type === 'image/png') {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPG/PNG images are allowed for product images'));
    return;
  }

  if (isPdfField) {
    if (type === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed for product introduction'));
    return;
  }

  cb(new Error('Unexpected upload field'));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

export const uploadProductAssets = upload;
