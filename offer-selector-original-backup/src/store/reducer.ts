import { AppState, Dimension, Offer } from '../types';
import { DEFAULT_DIMENSIONS, OPTIONAL_DIMENSIONS } from '../constants/dimensions';

// Action类型
export const ActionTypes = {
  ADD_OFFER: 'ADD_OFFER',
  REMOVE_OFFER: 'REMOVE_OFFER',
  UPDATE_OFFER: 'UPDATE_OFFER',
  TOGGLE_DIMENSION: 'TOGGLE_DIMENSION',
  UPDATE_DIMENSION: 'UPDATE_DIMENSION',
  REORDER_DIMENSIONS: 'REORDER_DIMENSIONS',
  ADD_CUSTOM_DIMENSION: 'ADD_CUSTOM_DIMENSION',
  REMOVE_CUSTOM_DIMENSION: 'REMOVE_CUSTOM_DIMENSION',
  LOAD_STATE: 'LOAD_STATE',
  CLEAR_ALL: 'CLEAR_ALL',
} as const;

// Action定义
export type Action =
  | { type: typeof ActionTypes.ADD_OFFER }
  | { type: typeof ActionTypes.REMOVE_OFFER; payload: { offerId: string } }
  | { type: typeof ActionTypes.UPDATE_OFFER; payload: { offerId: string; updates: Partial<Offer> } }
  | { type: typeof ActionTypes.TOGGLE_DIMENSION; payload: { dimensionId: string } }
  | { type: typeof ActionTypes.UPDATE_DIMENSION; payload: { dimensionId: string; updates: Partial<Dimension> } }
  | { type: typeof ActionTypes.REORDER_DIMENSIONS; payload: { dimensionIds: string[] } }
  | { type: typeof ActionTypes.ADD_CUSTOM_DIMENSION; payload: { dimension: Dimension } }
  | { type: typeof ActionTypes.REMOVE_CUSTOM_DIMENSION; payload: { dimensionId: string } }
  | { type: typeof ActionTypes.LOAD_STATE; payload: { state: Partial<AppState> } }
  | { type: typeof ActionTypes.CLEAR_ALL };

// 生成唯一ID
export function generateId(): string {
  return crypto.randomUUID();
}

// 初始状态
export function getInitialState(): AppState {
  return {
    dimensions: [...DEFAULT_DIMENSIONS, ...OPTIONAL_DIMENSIONS],
    offers: [],
  };
}

// 创建新Offer
function createNewOffer(): Offer {
  return {
    id: generateId(),
    values: {},
    extraBonuses: [],
  };
}

// 最大额外加分维度数量
export const MAX_BONUS_DIMENSIONS = 3;

// Reducer函数
export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case ActionTypes.ADD_OFFER: {
      const newOffer = createNewOffer();
      return {
        ...state,
        offers: [...state.offers, newOffer],
      };
    }

    case ActionTypes.REMOVE_OFFER: {
      const { offerId } = action.payload;
      return {
        ...state,
        offers: state.offers.filter(offer => offer.id !== offerId),
      };
    }

    case ActionTypes.UPDATE_OFFER: {
      const { offerId, updates } = action.payload;
      return {
        ...state,
        offers: state.offers.map(offer =>
          offer.id === offerId ? { ...offer, ...updates } : offer
        ),
      };
    }

    case ActionTypes.TOGGLE_DIMENSION: {
      const { dimensionId } = action.payload;
      return {
        ...state,
        dimensions: state.dimensions.map(d =>
          d.id === dimensionId ? { ...d, active: !d.active } : d
        ),
      };
    }

    case ActionTypes.UPDATE_DIMENSION: {
      const { dimensionId, updates } = action.payload;
      return {
        ...state,
        dimensions: state.dimensions.map(d =>
          d.id === dimensionId ? { ...d, ...updates } : d
        ),
      };
    }

    case ActionTypes.REORDER_DIMENSIONS: {
      const { dimensionIds } = action.payload;
      const dimMap = new Map<string, Dimension>(state.dimensions.map(d => [d.id, d]));
      const newDims: Dimension[] = [];
      
      dimensionIds.forEach(id => {
        const d = dimMap.get(id);
        if (d) {
          newDims.push(d);
          dimMap.delete(id);
        }
      });

      dimMap.forEach(d => newDims.push(d));
      
      return {
        ...state,
        dimensions: newDims,
      };
    }

    case ActionTypes.ADD_CUSTOM_DIMENSION: {
      const { dimension } = action.payload;
      return {
        ...state,
        dimensions: [...state.dimensions, dimension],
      };
    }

    case ActionTypes.REMOVE_CUSTOM_DIMENSION: {
      const { dimensionId } = action.payload;
      return {
        ...state,
        dimensions: state.dimensions.filter(d => d.id !== dimensionId),
        offers: state.offers.map(offer => ({
          ...offer,
          extraBonuses: offer.extraBonuses.filter(b => b.dimensionId !== dimensionId),
        })),
      };
    }

    case ActionTypes.LOAD_STATE: {
      const { state: loadedState } = action.payload;
      return {
        ...state,
        ...loadedState,
      };
    }

    case ActionTypes.CLEAR_ALL: {
      return getInitialState();
    }

    default:
      return state;
  }
}
