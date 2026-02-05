
export type DimensionType = 'text' | 'numeric' | 'select' | 'slider' | 'salary' | 'workload' | 'location';

export interface DimensionOption {
  label: string;
  value: string;
  score: number;
}

export interface Dimension {
  id: string;
  name: string;
  type: DimensionType;
  description?: string;
  isDefault: boolean;
  options?: DimensionOption[];
  active: boolean; // Whether it's currently used in scoring
  isPenalty?: boolean; // 新增：是否为扣分维度
}

export interface SalaryData {
  monthly: number;
  months: number;
  bonus: number;
}

export interface WorkloadData {
  hoursPerDay: number;
  daysPerWeek: number;
}

export interface LocationData {
  city: string;
  preference: 'met' | 'unmet' | 'indifferent';
}

export interface ExtraBonus {
  dimensionId: string;
  points: number;
}

export interface Offer {
  id: string;
  values: Record<string, any>; // dimensionId -> value
  extraBonuses: ExtraBonus[];
}

export interface ScoringResult {
  offerId: string;
  totalScore: number;
  baseScore: number;
  bonusScore: number;
  dimensionScores: Record<string, number>;
}
