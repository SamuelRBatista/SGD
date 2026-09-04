const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../interfaces/http/controllers/document-controller');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    callback(null, acceptedTypes.includes(file.mimetype));
  },
});

router.get('/', documentController.list);
router.post('/', upload.single('file'), documentController.create);
router.put('/:id', upload.single('file'), documentController.update);
router.delete('/:id', documentController.remove);

module.exports = router;
