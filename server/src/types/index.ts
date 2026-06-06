// ============================================================
// 搞定800词 · 核心类型定义
// ============================================================

// ---------- 通用 ----------
export interface ApiResponse<T = unknown> {
  code: number;           // 0=成功，非0=错误
  message: string;
  data: T | null;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------- 用户 / 认证 ----------
export interface WeChatLoginRequest {
  code: string;           // 微信登录 code（wx.login 获取）
}

export interface WeChatLoginResponse {
  token: string;          // JWT token
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  nickname: string | null;
  avatarUrl: string | null;
}

// ---------- JWT Payload ----------
export interface JwtPayload {
  userId: number;
  openid: string;
}

// ---------- 词汇 ----------
export interface VocabItem {
  id: number;
  word: string;
  definition: string;
  category: string | null;
  seqNo: number | null;
  example: string | null;
}

// ---------- 打卡 ----------
export interface TodayCheckInResponse {
  date: string;                         // YYYY-MM-DD
  completed: boolean;
  vocabCount: number;                   // 当前已学
  totalCount: number;                   // 当日总量
  vocabs: VocabItem[];                  // 当日词汇列表
  checkedAt: string | null;            // 完成时间
}

export interface CheckInSubmitRequest {
  date: string;                         // YYYY-MM-DD
}

export interface CheckInRecordItem {
  id: number;
  date: string;
  completed: boolean;
  vocabCount: number;
  totalCount: number;
  checkedAt: string | null;
}

// ---------- 错题 ----------
export interface WrongAnswerItem {
  id: number;
  word: string;
  definition: string;
  category: string | null;
  wrongCount: number;
  sourceType: 'DAILY' | 'SPRINT';
  createdAt: string;
}

export interface WrongAnswerStats {
  totalWrong: number;                   // 总错题数
  categoryBreakdown: {                  // 分类统计
    category: string;
    count: number;
  }[];
  accuracyRate: number;                 // 正确率（基于有记录的答题总数）
}

// ---------- 随心测 ----------
export interface StartTestRequest {
  timeLimit: number;                    // 倒计时秒数，0=不限时
  questionCount?: number;               // 题数，默认100
  categoryFilter?: string[];            // 可选：按分类筛选
}

export interface StartTestResponse {
  testId: number;
  questions: TestQuestion[];
  timeLimit: number;
  serverTime: string;                   // 服务器时间 ISO 字符串
}

export interface TestQuestion {
  sortNo: number;
  vocabId: number;
  word: string;
  // 释义和选项由前端决定展示方式
  // 这里返回词汇信息，前端自己加干扰项（释义判断题模式）
  definition: string;
}

export interface SubmitTestRequest {
  testId: number;
  answers: TestAnswerInput[];
  duration: number;                     // 实际用时秒数（用于服务端校验）
}

export interface TestAnswerInput {
  sortNo: number;
  vocabId: number;
  userAnswer: boolean;
}

export interface TestResultResponse {
  testId: number;
  score: number;
  total: number;
  accuracyRate: string;                 // 正确率百分比，如 "85.00%"
  duration: number;
  timeLimit: number;
  status: 'COMPLETED' | 'TIMEOUT';
  details: TestResultDetail[];
  wrongVocabs: WrongVocabRef[];        // 做错的词汇引用（前端可快速收录）
}

export interface TestResultDetail {
  sortNo: number;
  word: string;
  definition: string;
  userAnswer: boolean;
  isCorrect: boolean;
}

export interface WrongVocabRef {
  vocabId: number;
  word: string;
}

export interface TestHistoryItem {
  id: number;
  score: number;
  total: number;
  accuracyRate: string;
  duration: number;
  timeLimit: number;
  status: string;
  createdAt: string;
}

// ---------- 导入 ----------
export interface ImportResult {
  batchId: number;
  fileName: string;
  format: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  failures?: { row: number; reason: string }[];
}

// ---------- Express 扩展 ----------
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      openid?: string;
    }
  }
}
