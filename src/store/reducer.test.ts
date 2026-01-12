import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { appReducer, ActionTypes, getInitialState } from './reducer';
import { AppState, Dimension, Offer } from '../types';

describe('Reducer', () => {
  describe('ADD_OFFER', () => {
    it('should add a new offer to the state', () => {
      const state = getInitialState();
      const newState = appReducer(state, { type: ActionTypes.ADD_OFFER });
      
      expect(newState.offers).toHaveLength(1);
      expect(newState.offers[0].id).toBeDefined();
      expect(newState.offers[0].values).toEqual({});
      expect(newState.offers[0].extraBonuses).toEqual([]);
    });

    it('should preserve existing offers when adding new one', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            id: fc.uuid(),
            values: fc.constant({}),
            extraBonuses: fc.array(fc.record({
              dimensionId: fc.uuid(),
              points: fc.integer({ min: 0, max: 100 })
            }), { minLength: 0, maxLength: 3 })
          }), { minLength: 0, maxLength: 10 }),
          (existingOffers) => {
            const state: AppState = {
              ...getInitialState(),
              offers: existingOffers as Offer[]
            };
            const newState = appReducer(state, { type: ActionTypes.ADD_OFFER });
            
            return newState.offers.length === existingOffers.length + 1 &&
                   existingOffers.every(o => newState.offers.some(no => no.id === o.id));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('REMOVE_OFFER', () => {
    it('should remove the specified offer', () => {
      const state: AppState = {
        ...getInitialState(),
        offers: [
          { id: 'offer-1', values: {}, extraBonuses: [] },
          { id: 'offer-2', values: {}, extraBonuses: [] }
        ]
      };
      
      const newState = appReducer(state, {
        type: ActionTypes.REMOVE_OFFER,
        payload: { offerId: 'offer-1' }
      });
      
      expect(newState.offers).toHaveLength(1);
      expect(newState.offers[0].id).toBe('offer-2');
    });

    it('should not modify state if offer does not exist', () => {
      const state: AppState = {
        ...getInitialState(),
        offers: [{ id: 'offer-1', values: {}, extraBonuses: [] }]
      };
      
      const newState = appReducer(state, {
        type: ActionTypes.REMOVE_OFFER,
        payload: { offerId: 'non-existent' }
      });
      
      expect(newState.offers).toHaveLength(1);
    });
  });

  describe('UPDATE_OFFER', () => {
    it('should update offer values', () => {
      const state: AppState = {
        ...getInitialState(),
        offers: [{ id: 'offer-1', values: {}, extraBonuses: [] }]
      };
      
      const newState = appReducer(state, {
        type: ActionTypes.UPDATE_OFFER,
        payload: {
          offerId: 'offer-1',
          updates: { values: { company: 'Test Company' } }
        }
      });
      
      expect(newState.offers[0].values.company).toBe('Test Company');
    });
  });

  describe('TOGGLE_DIMENSION', () => {
    it('should toggle dimension active state', () => {
      const state = getInitialState();
      const firstDim = state.dimensions[0];
      const initialActive = firstDim.active;
      
      const newState = appReducer(state, {
        type: ActionTypes.TOGGLE_DIMENSION,
        payload: { dimensionId: firstDim.id }
      });
      
      const toggledDim = newState.dimensions.find(d => d.id === firstDim.id);
      expect(toggledDim?.active).toBe(!initialActive);
    });
  });

  describe('REORDER_DIMENSIONS', () => {
    it('should reorder dimensions according to new order', () => {
      const state: AppState = {
        ...getInitialState(),
        dimensions: [
          { id: 'dim-1', name: '维度1', type: 'text', isDefault: true, active: true },
          { id: 'dim-2', name: '维度2', type: 'text', isDefault: true, active: true },
          { id: 'dim-3', name: '维度3', type: 'text', isDefault: true, active: true }
        ]
      };
      
      const newState = appReducer(state, {
        type: ActionTypes.REORDER_DIMENSIONS,
        payload: { dimensionIds: ['dim-3', 'dim-1', 'dim-2'] }
      });
      
      expect(newState.dimensions.map(d => d.id)).toEqual(['dim-3', 'dim-1', 'dim-2']);
    });
  });

  describe('ADD_CUSTOM_DIMENSION', () => {
    it('should add a custom dimension', () => {
      const state = getInitialState();
      const customDim: Dimension = {
        id: 'custom-1',
        name: '自定义维度',
        type: 'select',
        isDefault: false,
        active: true,
        options: [
          { label: '好', value: 'good', score: 100 },
          { label: '差', value: 'bad', score: 0 }
        ]
      };
      
      const newState = appReducer(state, {
        type: ActionTypes.ADD_CUSTOM_DIMENSION,
        payload: { dimension: customDim }
      });
      
      expect(newState.dimensions.find(d => d.id === 'custom-1')).toBeDefined();
    });
  });

  describe('REMOVE_CUSTOM_DIMENSION', () => {
    it('should remove custom dimension and related bonus dimensions', () => {
      const state: AppState = {
        ...getInitialState(),
        dimensions: [
          ...getInitialState().dimensions,
          { id: 'custom-1', name: '自定义', type: 'select', isDefault: false, active: true }
        ],
        offers: [{
          id: 'offer-1',
          values: {},
          extraBonuses: [{ dimensionId: 'custom-1', points: 50 }]
        }]
      };
      
      const newState = appReducer(state, {
        type: ActionTypes.REMOVE_CUSTOM_DIMENSION,
        payload: { dimensionId: 'custom-1' }
      });
      
      expect(newState.dimensions.find(d => d.id === 'custom-1')).toBeUndefined();
      expect(newState.offers[0].extraBonuses).toHaveLength(0);
    });
  });

  describe('CLEAR_ALL', () => {
    it('should reset to initial state', () => {
      const state: AppState = {
        dimensions: [],
        offers: [{ id: 'offer-1', values: {}, extraBonuses: [] }]
      };
      
      const newState = appReducer(state, { type: ActionTypes.CLEAR_ALL });
      const initialState = getInitialState();
      
      expect(newState.offers).toHaveLength(0);
      expect(newState.dimensions.length).toBe(initialState.dimensions.length);
    });
  });

  describe('Property: State immutability', () => {
    it('should not mutate the original state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { type: ActionTypes.ADD_OFFER },
            { type: ActionTypes.CLEAR_ALL }
          ),
          (action) => {
            const state = getInitialState();
            const originalState = JSON.stringify(state);
            appReducer(state, action as any);
            return JSON.stringify(state) === originalState;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
