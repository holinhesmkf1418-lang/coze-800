import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// 路由
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import vocabRoutes from './routes/vocab';
import checkInRoutes from './routes/checkIn';
import wrongAnswerRoutes from './routes/wrongAnswer';
import testRoutes from './routes/test';
import importRoutes from './routes/import';

const app = express();

// ---------- 全局中间件 ----------
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ---------- 路由注册 ----------
app.use('/api/health', healthRoutes);          // 健康检查
app.use('/api/auth', authRoutes);              // 微信登录
app.use('/api/vocabs', vocabRoutes);           // 词汇相关
app.use('/api/check-in', checkInRoutes);       // 打卡
app.use('/api/wrong-answers', wrongAnswerRoutes); // 错题
app.use('/api/tests', testRoutes);             // 随心测
app.use('/api/import', importRoutes);          // 数据导入

// ---------- 全局错误处理 ----------
app.use(errorHandler);

export default app;
