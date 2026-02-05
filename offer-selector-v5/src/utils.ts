import { Offer, Dimension, ScoringResult, SalaryData, WorkloadData, LocationData } from './types';

// 计算权重
export const calculateWeights = (activeDimensions: Dimension[]): Record<string, number> => {
  const n = activeDimensions.length;
  const s = (n * (n + 1)) / 2;
  const weights: Record<string, number> = {};

  activeDimensions.forEach((dim, index) => {
    const rank = index + 1;
    weights[dim.id] = (n - rank + 1) / s;
  });

  return weights;
};

// 计算年薪
export const calculateYearlySalary = (data: SalaryData): number => {
  return (data.monthly || 0) * (data.months || 0) + (data.bonus || 0);
};

// 计算周工作时长
export const calculateWeeklyWorkload = (data: WorkloadData): number => {
  return (data.hoursPerDay || 0) * (data.daysPerWeek || 0);
};

// 获取维度分数
export const getDimensionScore = (
  dimension: Dimension,
  value: any,
  allOffers: Offer[],
  dimensionId: string
): number => {
  if (dimensionId === 'company') return 0;

  let score = 0;

  switch (dimension.id) {
    case 'salary': {
      const yearly = calculateYearlySalary(value as SalaryData || { monthly: 0, months: 0, bonus: 0 });
      const maxSalary = Math.max(...allOffers.map(o => calculateYearlySalary(o.values['salary'] || { monthly: 0, months: 0, bonus: 0 })), 1);
      score = (yearly / maxSalary) * 100;
      break;
    }
    case 'location': {
      const loc = value as LocationData;
      const prefValue = loc?.preference || 'indifferent';
      const option = dimension.options?.find(o => o.value === prefValue);
      score = option ? option.score : 50;
      break;
    }
    case 'workload': {
      const weekly = calculateWeeklyWorkload(value as WorkloadData || { hoursPerDay: 0, daysPerWeek: 0 });
      score = Math.max(0, 100 - (weekly - 40) * 5);
      break;
    }
    case 'annualLeave': {
      const days = Number(value) || 0;
      const maxDays = Math.max(...allOffers.map(o => Number(o.values['annualLeave']) || 0), 1);
      score = (days / maxDays) * 100;
      break;
    }
    case 'turnover': {
      const count = Number(value) || 0;
      score = Math.max(0, 100 - count * 15);
      break;
    }
    case 'salaryIncrease': {
      if (value === 'unsure') {
        score = 50;
      } else {
        const pct = Number(value) || 0;
        score = Math.min(100, pct * 10);
      }
      break;
    }
    default: {
      if ((dimension.type === 'select' || dimension.type === 'location') && dimension.options) {
        const option = dimension.options.find(o => o.value === value || (typeof value === 'object' && value?.preference === o.value));
        score = option ? option.score : 0;
      } else if (dimension.type === 'slider') {
        score = Number(value) || 0;
      } else if (dimension.type === 'numeric') {
        const val = Number(value) || 0;
        const max = Math.max(...allOffers.map(o => Number(o.values[dimension.id]) || 0), 1);
        score = (val / max) * 100;
      } else {
        score = 0;
      }
      break;
    }
  }

  return Math.max(-100, Math.min(100, score));
};

// 计算所有 Offer 的评分
export const calculateOfferScores = (
  offers: Offer[],
  activeDimensions: Dimension[],
  weights: Record<string, number>
): ScoringResult[] => {
  const scoringDimensions = activeDimensions.filter(d => d.id !== 'company');
  
  return offers.map(offer => {
    const dimensionScores: Record<string, number> = {};
    let baseScore = 0;

    scoringDimensions.forEach(dim => {
      const score = getDimensionScore(dim, offer.values[dim.id], offers, dim.id);
      dimensionScores[dim.id] = score;
      baseScore += (weights[dim.id] || 0) * score;
    });

    let bonusScore = 0;
    offer.extraBonuses.forEach(bonus => {
      const dim = activeDimensions.find(d => d.id === bonus.dimensionId);
      if (dim?.isPenalty) return;

      const weight = weights[bonus.dimensionId] || 0;
      bonusScore += weight * bonus.points;
    });

    const totalScore = Math.max(0, Math.min(100, baseScore + bonusScore));

    return {
      offerId: offer.id,
      baseScore,
      bonusScore,
      totalScore,
      dimensionScores
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
};
