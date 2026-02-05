
import { Offer, Dimension, ScoringResult, SalaryData, WorkloadData, LocationData } from '../types';

export const calculateWeights = (activeDimensions: Dimension[]) => {
  const n = activeDimensions.length;
  const s = (n * (n + 1)) / 2;
  const weights: Record<string, number> = {};

  activeDimensions.forEach((dim, index) => {
    // Rank i starts from 1
    const rank = index + 1;
    weights[dim.id] = (n - rank + 1) / s;
  });

  return weights;
};

export const calculateYearlySalary = (data: SalaryData) => {
  return (data.monthly || 0) * (data.months || 0) + (data.bonus || 0);
};

export const calculateWeeklyWorkload = (data: WorkloadData) => {
  return (data.hoursPerDay || 0) * (data.daysPerWeek || 0);
};

export const getDimensionScore = (
  dimension: Dimension,
  value: any,
  allOffers: Offer[],
  dimensionId: string
) => {
  if (dimensionId === 'company') return 0;

  switch (dimension.id) {
    case 'salary': {
      const yearly = calculateYearlySalary(value as SalaryData || { monthly: 0, months: 0, bonus: 0 });
      const maxSalary = Math.max(...allOffers.map(o => calculateYearlySalary(o.values['salary'] || { monthly: 0, months: 0, bonus: 0 })), 1);
      return (yearly / maxSalary) * 100;
    }
    case 'location': {
      const loc = value as LocationData;
      const prefValue = loc?.preference || 'indifferent';
      const option = dimension.options?.find(o => o.value === prefValue);
      return option ? option.score : 50;
    }
    case 'workload': {
      const weekly = calculateWeeklyWorkload(value as WorkloadData || { hoursPerDay: 0, daysPerWeek: 0 });
      return Math.max(0, 100 - (weekly - 40) * 5);
    }
    case 'annualLeave': {
      const days = Number(value) || 0;
      const maxDays = Math.max(...allOffers.map(o => Number(o.values['annualLeave']) || 0), 1);
      return (days / maxDays) * 100;
    }
    case 'turnover': {
      const count = Number(value) || 0;
      return Math.max(0, 100 - count * 15);
    }
    case 'salaryIncrease': {
      if (value === 'unsure') return 50;
      const pct = Number(value) || 0;
      return Math.min(100, pct * 10);
    }
    default: {
      // Handles selects, sliders, and custom dimensions
      if ((dimension.type === 'select' || dimension.type === 'location') && dimension.options) {
        const option = dimension.options.find(o => o.value === value || (typeof value === 'object' && value?.preference === o.value));
        return option ? option.score : 0;
      }
      if (dimension.type === 'slider') {
        return Number(value) || 0;
      }
      if (dimension.type === 'numeric') {
         const val = Number(value) || 0;
         const max = Math.max(...allOffers.map(o => Number(o.values[dimension.id]) || 0), 1);
         return (val / max) * 100;
      }
      return 0;
    }
  }
};

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
      // 核心：如果该维度是扣分维度，跳过额外加分计算
      const dim = activeDimensions.find(d => d.id === bonus.dimensionId);
      if (dim?.isPenalty) return;

      const weight = weights[bonus.dimensionId] || 0;
      bonusScore += weight * bonus.points;
    });

    return {
      offerId: offer.id,
      baseScore,
      bonusScore,
      totalScore: baseScore + bonusScore,
      dimensionScores
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
};
