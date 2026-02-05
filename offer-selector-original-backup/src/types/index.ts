// 维度类型
export type DimensionType =
  | 'text'           // 纯文本（不参与评分）
  | 'numeric'        // 数值输入
  | 'salary'         // 薪酬（月薪×月份+奖励）
  | 'workload'       // 工作时长（小时×天数）
  | 'select'         // 单选
  | 'slider'         // 滑动条
  | 'location';      // 地点（城市+符合程度）

// 维度分类
export type DimensionCategory = 'objective' | 'subjective' | 'personal';

export const CATEGORY_LABELS: Record<DimensionCategory, string> = {
  objective: '岗位客观事实',
  subjective: '岗位主观因素',
  personal: '个人自身理想'
};

export const CATEGORY_COLORS: Record<DimensionCategory, { bg: string; text: string; border: string; light: string; ring: string }> = {
  objective: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50', ring: 'ring-blue-50' },
  subjective: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50', ring: 'ring-purple-50' },
  personal: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50', ring: 'ring-emerald-50' }
};

// 单选选项
export interface DimensionOption {
  value: string;
  label: string;
  score: number;  // 该选项对应的分数
}

// 维度定义
export interface Dimension {
  id: string;
  name: string;
  type: DimensionType;
  category: DimensionCategory;  // 维度分类
  description?: string;
  isDefault: boolean;      // 是否默认维度
  active: boolean;         // 是否启用
  options?: DimensionOption[]; // 单选选项
  isPenalty?: boolean;     // 是否为扣分维度
}

// 薪酬值
export interface SalaryData {
  monthly: number;
  months: number;
  bonus: number;
}

// 工作时长值
export interface WorkloadData {
  hoursPerDay: number;
  daysPerWeek: number;
}

// 地点值
export interface LocationData {
  city: string;
  preference: 'met' | 'unmet' | 'indifferent';
}

// 额外加分
export interface ExtraBonus {
  dimensionId: string;
  points: number;  // 额外分数 0-100
}

// Offer
export interface Offer {
  id: string;
  values: Record<string, any>;  // dimensionId -> value
  extraBonuses: ExtraBonus[];
}

// 评分结果
export interface ScoringResult {
  offerId: string;
  totalScore: number;
  baseScore: number;
  bonusScore: number;
  dimensionScores: Record<string, number>;
}

// 应用状态
export interface AppState {
  dimensions: Dimension[];
  offers: Offer[];
}

// LocalStorage数据结构
export interface StorageData {
  version: number;
  dimensions: Dimension[];
  offers: Offer[];
  lastUpdated: number;
}

// 存储键名
export const STORAGE_KEY = 'job_selector_data';
export const OFFERS_KEY = 'job_selector_offers';
export const DIMENSIONS_KEY = 'job_selector_dimensions';
