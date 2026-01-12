import { describe, it, expect } from 'vitest'
import { DEFAULT_DIMENSIONS, OPTIONAL_DIMENSIONS } from './dimensions'

describe('Dimensions Constants', () => {
  describe('DEFAULT_DIMENSIONS', () => {
    it('should have 7 default dimensions', () => {
      expect(DEFAULT_DIMENSIONS).toHaveLength(7)
    })

    it('should include company as first dimension', () => {
      const company = DEFAULT_DIMENSIONS.find(d => d.id === 'company')
      expect(company).toBeDefined()
      expect(company?.type).toBe('text')
      expect(company?.active).toBe(true)
    })

    it('should include salary dimension with correct type', () => {
      const salary = DEFAULT_DIMENSIONS.find(d => d.id === 'salary')
      expect(salary).toBeDefined()
      expect(salary?.type).toBe('salary')
      expect(salary?.active).toBe(true)
    })

    it('should include workload dimension with correct type', () => {
      const workload = DEFAULT_DIMENSIONS.find(d => d.id === 'workload')
      expect(workload).toBeDefined()
      expect(workload?.type).toBe('workload')
    })

    it('should have isCore with select options', () => {
      const isCore = DEFAULT_DIMENSIONS.find(d => d.id === 'isCore')
      expect(isCore).toBeDefined()
      expect(isCore?.type).toBe('select')
      expect(isCore?.options).toHaveLength(3)
    })

    it('should have pua as penalty dimension', () => {
      const pua = DEFAULT_DIMENSIONS.find(d => d.id === 'pua')
      expect(pua).toBeDefined()
      expect(pua?.isPenalty).toBe(true)
      expect(pua?.options?.some(o => o.score < 0)).toBe(true)
    })

    it('should have location dimension with location type', () => {
      const location = DEFAULT_DIMENSIONS.find(d => d.id === 'location')
      expect(location).toBeDefined()
      expect(location?.type).toBe('location')
      expect(location?.options).toHaveLength(3)
    })
  })

  describe('OPTIONAL_DIMENSIONS', () => {
    it('should have 12 optional dimensions', () => {
      expect(OPTIONAL_DIMENSIONS).toHaveLength(12)
    })

    it('should all have active set to false', () => {
      OPTIONAL_DIMENSIONS.forEach(dim => {
        expect(dim.active).toBe(false)
      })
    })

    it('should all have isDefault set to false', () => {
      OPTIONAL_DIMENSIONS.forEach(dim => {
        expect(dim.isDefault).toBe(false)
      })
    })

    it('should include annualLeave dimension', () => {
      const annualLeave = OPTIONAL_DIMENSIONS.find(d => d.id === 'annualLeave')
      expect(annualLeave).toBeDefined()
      expect(annualLeave?.type).toBe('numeric')
    })

    it('should include exitDifficulty with select type', () => {
      const exitDifficulty = OPTIONAL_DIMENSIONS.find(d => d.id === 'exitDifficulty')
      expect(exitDifficulty).toBeDefined()
      expect(exitDifficulty?.type).toBe('select')
    })
  })
})
