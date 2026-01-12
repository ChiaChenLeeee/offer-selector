import { describe, it, expect } from 'vitest'
import type { Dimension, Offer, DimensionType } from './index'

describe('Types', () => {
  it('should allow creating a valid Dimension', () => {
    const dimension: Dimension = {
      id: 'test',
      name: '测试维度',
      type: 'text',
      isDefault: false,
      active: true
    }
    expect(dimension.id).toBe('test')
    expect(dimension.type).toBe('text')
  })

  it('should allow creating a valid Offer', () => {
    const offer: Offer = {
      id: 'offer-1',
      values: {},
      extraBonuses: []
    }
    expect(offer.id).toBe('offer-1')
    expect(offer.extraBonuses).toHaveLength(0)
  })

  it('should support all dimension types', () => {
    const types: DimensionType[] = [
      'text',
      'numeric',
      'salary',
      'workload',
      'select',
      'slider',
      'location'
    ]
    expect(types).toHaveLength(7)
  })
})
