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
  options: TestOption[];    // 4 个选项（含 1 个正确答案 + 3 个干扰项）
  // ⚠️ answerKey 不返回给前端——正确答案仅在后端存储用于判分
}

export interface TestOption {
  label: string;            // "A" | "B" | "C" | "D"
  text: string;             // 选项释义文本
}

export interface SubmitTestRequest {
  testId: number;
  answers: TestAnswerInput[];
  duration: number;                     // 实际用时秒数（用于服务端校验）
}

export interface TestAnswerInput {
  sortNo: number;
  selectedOption: string;               // 用户选择的选项 label，如 "A"
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
  options: TestOption[];          // 完整选项
  selectedOption: string | null;  // 用户选择的 label
  correctOption: string;          // 正确答案 label
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
