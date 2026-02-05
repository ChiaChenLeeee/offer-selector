// 维度类型
export type DimensionType =
  | 'text'
  | 'numeric'
  | 'salary'
  | 'workload'
  | 'select'
  | 'slider'
  | 'location';

// 维度分类
export type DimensionCategory = 'objective' | 'subjective' | 'personal';

// 分类标签
export const CATEGORY_LABELS: Record<DimensionCategory, string> = {
  objective: '岗位客观事实',
  subjective: '岗位主观因素',
  personal: '个人生活成长'
};

// 分类颜色
export const CATEGORY_COLORS: Record<DimensionCategory, {
  bg: string;
  text: string;
  border: string;
  light: string;
  ring: string;
}> = {
  objective: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-200',
    light: 'bg-blue-50',
    ring: 'ring-blue-50'
  },
  subjective: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-200',
    light: 'bg-purple-50',
    ring: 'ring-purple-50'
  },
  personal: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-200',
    light: 'bg-orange-50',
    ring: 'ring-orange-50'
  }
};

// 单选选项
export interface DimensionOption {
  value: string;
  label: string;
  score: number;
}

// 维度定义
export interface Dimension {
  id: string;
  name: string;
  type: DimensionType;
  category: DimensionCategory;
  description?: string;
  isDefault: boolean;
  active: boolean;
  options?: DimensionOption[];
  isPenalty?: boolean;
}

// 薪酬数据
export interface SalaryData {
  monthly: number;
  months: number;
  bonus: number;
}

// 工作时长数据
export interface WorkloadData {
  hoursPerDay: number;
  daysPerWeek: number;
}

// 地点数据
export interface LocationData {
  city: string;
  preference: 'met' | 'unmet' | 'indifferent';
}

// 额外加分
export interface ExtraBonus {
  dimensionId: string;
  points: number;
}

// Offer
export interface Offer {
  id: string;
  values: Record<string, any>;
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
