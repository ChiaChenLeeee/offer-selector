import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { saveData, loadData, clearData, CURRENT_VERSION } from './storage';
import { StorageData, Dimension, Offer, DimensionType, DimensionOption, ExtraBonus, DimensionCategory } from '../types';

// 生成器：维度类型
const dimensionTypeArb: fc.Arbitrary<DimensionType> = fc.constantFrom(
  'text', 'numeric', 'salary', 'workload', 'select', 'slider', 'location'
);

// 生成器：维度分类
const dimensionCategoryArb: fc.Arbitrary<DimensionCategory> = fc.constantFrom(
  'objective', 'subjective', 'personal'
);

// 生成器：单选选项
const dimensionOptionArb: fc.Arbitrary<DimensionOption> = fc.record({
  value: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  score: fc.integer({ min: -100, max: 100 })
});

// 生成器：维度
const dimensionArb: fc.Arbitrary<Dimension> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: dimensionTypeArb,
  category: dimensionCategoryArb,
  isDefault: fc.boolean(),
  active: fc.boolean(),
  options: fc.option(fc.array(dimensionOptionArb, { minLength: 1, maxLength: 5 }), { nil: undefined }),
  isPenalty: fc.option(fc.boolean(), { nil: undefined }),
  description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
});

// 生成器：额外加分
const extraBonusArb: fc.Arbitrary<ExtraBonus> = fc.record({
  dimensionId: fc.uuid(),
  points: fc.integer({ min: 0, max: 100 })
});

// 生成器：Offer
const offerArb: fc.Arbitrary<Offer> = fc.record({
  id: fc.uuid(),
  values: fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.oneof(
    fc.string({ maxLength: 100 }),
    fc.integer({ min: 0, max: 1000000 }),
    fc.constant(null)
  )),
  extraBonuses: fc.array(extraBonusArb, { minLength: 0, maxLength: 3 })
});

// 生成器：存储数据
const storageDataArb: fc.Arbitrary<StorageData> = fc.record({
  version: fc.integer({ min: 1, max: 100 }),
  dimensions: fc.array(dimensionArb, { minLength: 0, maxLength: 10 }),
  offers: fc.array(offerArb, { minLength: 0, maxLength: 10 }),
  lastUpdated: fc.integer({ min: 0, max: Date.now() + 1000000000 })
});

describe('数据持久化层', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Feature: offer-selector, Property 11: 数据持久化往返正确性
  describe('Property 11: 数据持久化往返正确性', () => {
    it('对于任意有效的应用状态，保存到LocalStorage后再读取，应得到与原始状态等价的数据', () => {
      fc.assert(
        fc.property(storageDataArb, (originalData) => {
          saveData(originalData);
          const loadedData = loadData();
          
          if (loadedData === null) {
            return false;
          }
          
          return JSON.stringify(originalData) === JSON.stringify(loadedData);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('saveData', () => {
    it('应该成功保存数据到localStorage', () => {
      const data: StorageData = {
        version: CURRENT_VERSION,
        dimensions: [],
        offers: [],
        lastUpdated: Date.now()
      };
      
      saveData(data);
      
      const stored = localStorage.getItem('job_selector_data');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(data);
    });
  });

  describe('loadData', () => {
    it('当localStorage为空时应返回null', () => {
      const result = loadData();
      expect(result).toBeNull();
    });

    it('当数据损坏时应返回null', () => {
      localStorage.setItem('job_selector_data', 'invalid json');
      const result = loadData();
      expect(result).toBeNull();
    });

    it('当数据结构无效时应返回null', () => {
      localStorage.setItem('job_selector_data', JSON.stringify({ invalid: 'data' }));
      const result = loadData();
      expect(result).toBeNull();
    });
  });

  describe('clearData', () => {
    it('应该清除localStorage中的数据', () => {
      const data: StorageData = {
        version: CURRENT_VERSION,
        dimensions: [],
        offers: [],
        lastUpdated: Date.now()
      };
      
      saveData(data);
      expect(localStorage.getItem('job_selector_data')).not.toBeNull();
      
      clearData();
      expect(localStorage.getItem('job_selector_data')).toBeNull();
    });
  });
});
