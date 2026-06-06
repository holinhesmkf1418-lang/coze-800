import { Request, Response, NextFunction } from 'express';

/**
 * 全局错误处理中间件
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message, err.stack);

  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? '服务器内部错误'
      : err.message,
    data: null,
  });
}

/**
 * 自定义业务错误类
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
