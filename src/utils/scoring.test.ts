import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateWeights,
  calculateWeeklyWorkload,
  calculateYearlySalary,
  calculateOfferScores,
} from './scoring';
import { Dimension, Offer, SalaryData, WorkloadData } from '../types';

describe('评分计算引擎', () => {
  // Feature: offer-selector, Property 3: 权重计算正确性
  describe('Property 3: 权重计算正确性', () => {
    it('对于任意n个维度，所有权重之和等于1（允许浮点误差±0.0001）', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), (n) => {
          const dimensions: Dimension[] = Array.from({ length: n }, (_, i) => ({
            id: `dim_${i}`,
            name: `维度${i}`,
            type: 'select' as const,
            category: 'objective' as const,
            isDefault: true,
            active: true
          }));
          const weights = calculateWeights(dimensions);
          const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
          return Math.abs(sum - 1) < 0.0001;
        }),
        { numRuns: 100 }
      );
    });

    it('对于任意n个维度，权重按排序位置递减', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 20 }), (n) => {
          const dimensions: Dimension[] = Array.from({ length: n }, (_, i) => ({
            id: `dim_${i}`,
            name: `维度${i}`,
            type: 'select' as const,
            category: 'objective' as const,
            isDefault: true,
            active: true
          }));
          const weights = calculateWeights(dimensions);
          const weightValues = dimensions.map(d => weights[d.id]);
          for (let i = 0; i < weightValues.length - 1; i++) {
            if (weightValues[i] < weightValues[i + 1]) {
              return false;
            }
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('空维度数组返回空权重对象', () => {
      expect(calculateWeights([])).toEqual({});
    });
  });

  // Feature: offer-selector, Property 6: 上班时长计算正确性
  describe('Property 6: 上班时长计算正确性', () => {
    it('对于任意工时值，周工时应等于每日工时×每周天数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 24 }),
          fc.integer({ min: 1, max: 7 }),
          (hoursPerDay, daysPerWeek) => {
            const workload: WorkloadData = { hoursPerDay, daysPerWeek };
            const weeklyHours = calculateWeeklyWorkload(workload);
            return weeklyHours === hoursPerDay * daysPerWeek;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('标准40小时工作制计算正确', () => {
      const weeklyHours = calculateWeeklyWorkload({ hoursPerDay: 8, daysPerWeek: 5 });
      expect(weeklyHours).toBe(40);
    });

    it('996工作制计算正确', () => {
      const weeklyHours = calculateWeeklyWorkload({ hoursPerDay: 12, daysPerWeek: 6 });
      expect(weeklyHours).toBe(72);
    });
  });

  // Feature: offer-selector, Property 7: 年薪计算正确性
  describe('Property 7: 年薪计算正确性', () => {
    it('对于任意薪资数据，年薪应等于月薪×月份+奖金', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100000 }),
          fc.integer({ min: 0, max: 24 }),
          fc.integer({ min: 0, max: 500000 }),
          (monthly, months, bonus) => {
            const salary: SalaryData = { monthly, months, bonus };
            const yearly = calculateYearlySalary(salary);
            return yearly === monthly * months + bonus;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('空薪资数据返回0', () => {
      const yearly = calculateYearlySalary({ monthly: 0, months: 0, bonus: 0 });
      expect(yearly).toBe(0);
    });
  });

  // Feature: offer-selector, Property 8: 综合评分计算正确性
  describe('Property 8: 综合评分计算正确性', () => {
    it('评分结果按总分降序排列', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              values: fc.constant({}),
              extraBonuses: fc.array(fc.record({
                dimensionId: fc.uuid(),
                points: fc.integer({ min: 0, max: 100 })
              }), { minLength: 0, maxLength: 3 })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (offers) => {
            const dimensions: Dimension[] = [
              { id: 'test', name: '测试', type: 'slider', category: 'objective', isDefault: true, active: true }
            ];
            const weights = calculateWeights(dimensions);
            const results = calculateOfferScores(offers as Offer[], dimensions, weights);
            
            for (let i = 0; i < results.length - 1; i++) {
              if (results[i].totalScore < results[i + 1].totalScore) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('空Offer列表返回空结果', () => {
      const results = calculateOfferScores([], [], {});
      expect(results).toEqual([]);
    });
  });

  // Feature: offer-selector, Property 9: 扣分维度正确性
  describe('Property 9: 扣分维度正确性', () => {
    it('扣分维度的额外加分不计入总分', () => {
      const penaltyDim: Dimension = {
        id: 'penalty',
        name: '扣分项',
        type: 'select',
        category: 'subjective',
        isDefault: true,
        active: true,
        isPenalty: true,
        options: [
          { label: '是', value: 'yes', score: -100 },
          { label: '否', value: 'no', score: 0 }
        ]
      };
      
      const offer: Offer = {
        id: 'test',
        values: { penalty: 'no' },
        extraBonuses: [{ dimensionId: 'penalty', points: 50 }]
      };
      
      const weights = calculateWeights([penaltyDim]);
      const results = calculateOfferScores([offer], [penaltyDim], weights);
      
      // 扣分维度的额外加分应该被忽略
      expect(results[0].bonusScore).toBe(0);
    });
  });
});
