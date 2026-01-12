import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { AppState, Dimension, Offer, StorageData } from '../types';
import { appReducer, getInitialState, ActionTypes, Action } from './reducer';
import { saveData, loadData, CURRENT_VERSION } from '../utils/storage';

// Context类型定义
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addOffer: () => void;
  removeOffer: (offerId: string) => void;
  updateOffer: (offerId: string, updates: Partial<Offer>) => void;
  toggleDimension: (dimensionId: string) => void;
  updateDimension: (dimensionId: string, updates: Partial<Dimension>) => void;
  reorderDimensions: (dimensionIds: string[]) => void;
  addCustomDimension: (dimension: Dimension) => void;
  removeCustomDimension: (dimensionId: string) => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, null, () => {
    const savedData = loadData();
    if (savedData) {
      return {
        dimensions: savedData.dimensions,
        offers: savedData.offers,
      };
    }
    return getInitialState();
  });

  useEffect(() => {
    const dataToSave: StorageData = {
      version: CURRENT_VERSION,
      dimensions: state.dimensions,
      offers: state.offers,
      lastUpdated: Date.now(),
    };
    saveData(dataToSave);
  }, [state.dimensions, state.offers]);

  const addOffer = useCallback(() => {
    dispatch({ type: ActionTypes.ADD_OFFER });
  }, []);

  const removeOffer = useCallback((offerId: string) => {
    dispatch({ type: ActionTypes.REMOVE_OFFER, payload: { offerId } });
  }, []);

  const updateOffer = useCallback((offerId: string, updates: Partial<Offer>) => {
    dispatch({ type: ActionTypes.UPDATE_OFFER, payload: { offerId, updates } });
  }, []);

  const toggleDimension = useCallback((dimensionId: string) => {
    dispatch({ type: ActionTypes.TOGGLE_DIMENSION, payload: { dimensionId } });
  }, []);

  const updateDimension = useCallback((dimensionId: string, updates: Partial<Dimension>) => {
    dispatch({ type: ActionTypes.UPDATE_DIMENSION, payload: { dimensionId, updates } });
  }, []);

  const reorderDimensions = useCallback((dimensionIds: string[]) => {
    dispatch({ type: ActionTypes.REORDER_DIMENSIONS, payload: { dimensionIds } });
  }, []);

  const addCustomDimension = useCallback((dimension: Dimension) => {
    dispatch({ type: ActionTypes.ADD_CUSTOM_DIMENSION, payload: { dimension } });
  }, []);

  const removeCustomDimension = useCallback((dimensionId: string) => {
    dispatch({ type: ActionTypes.REMOVE_CUSTOM_DIMENSION, payload: { dimensionId } });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ALL });
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    addOffer,
    removeOffer,
    updateOffer,
    toggleDimension,
    updateDimension,
    reorderDimensions,
    addCustomDimension,
    removeCustomDimension,
    clearAll,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { AppContext };
