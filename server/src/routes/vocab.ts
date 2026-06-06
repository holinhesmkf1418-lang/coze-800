import { Router, Request, Response } from 'express';
import { vocabService } from '../services/vocabService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/vocabs/categories
 * 获取所有词汇分类
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await vocabService.getCategories();
    res.json({ code: 0, message: 'ok', data: categories });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * GET /api/vocabs/:id
 * 获取单个词汇详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const map = await vocabService.getByIds([id]);
    const vocab = map.get(id);

    if (!vocab) {
      res.status(404).json({ code: 404, message: '词汇不存在', data: null });
      return;
    }

    res.json({ code: 0, message: 'ok', data: vocab });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;
