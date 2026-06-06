import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importService } from '../services/importService';
import { config } from '../config';

const router = Router();

// 上传文件配置
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.一-鿿-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.import.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.json'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 CSV 或 JSON 格式文件'));
    }
  },
});

/**
 * POST /api/import/upload
 * 上传并导入 800 词数据
 *
 * 支持格式：
 * - JSON: [{ word, definition, category?, seqNo?, example? }]
 * - CSV: word,definition,category,seqNo,example
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ code: 400, message: '请上传文件', data: null });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const result = ext === '.json'
      ? await importService.importJSON(req.file.path, req.file.originalname)
      : await importService.importCSV(req.file.path, req.file.originalname);

    // 清理上传文件
    fs.unlink(req.file.path, () => {});

    res.json({
      code: 0,
      message: `导入完成: 成功 ${result.successCount} / 失败 ${result.failCount}`,
      data: result,
    });
  } catch (err: any) {
    // 清理上传文件
    if (req.file) fs.unlink(req.file.path, () => {});

    res.status(400).json({ code: 400, message: err.message, data: null });
  }
});

/**
 * GET /api/import/history
 * 查询导入批次历史
 */
router.get('/history', async (_req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const batches = await prisma.importBatch.findMany({
      orderBy: { importedAt: 'desc' },
      take: 20,
    });
    res.json({ code: 0, message: 'ok', data: batches });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;
