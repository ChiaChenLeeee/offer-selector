import { useState, useEffect, useMemo } from 'react';
import { Offer, Dimension } from './types';
import { DEFAULT_DIMENSIONS, OPTIONAL_DIMENSIONS } from './constants/dimensions';
import { calculateWeights, calculateOfferScores } from './utils/scoring';
import OfferForm from './components/OfferForm';
import DimensionManager from './components/DimensionManager';
import Ranker from './components/Ranker';
import ResultsView from './components/ResultsView';
import { LayoutGrid, ListTodo, SlidersHorizontal, BarChart3, Trash2, PlusCircle } from 'lucide-react';

const OFFERS_KEY = 'job_selector_offers';
const DIMENSIONS_KEY = 'job_selector_dimensions';

function App() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allDimensions, setAllDimensions] = useState<Dimension[]>(() => {
    const savedDims = localStorage.getItem(DIMENSIONS_KEY);
    if (savedDims) {
      try {
        return JSON.parse(savedDims);
      } catch {
        return [...DEFAULT_DIMENSIONS, ...OPTIONAL_DIMENSIONS];
      }
    }
    return [...DEFAULT_DIMENSIONS, ...OPTIONAL_DIMENSIONS];
  });
  const [activeTab, setActiveTab] = useState<'offers' | 'dimensions' | 'results'>('offers');

  // Load offers on mount
  useEffect(() => {
    const savedOffers = localStorage.getItem(OFFERS_KEY);
    if (savedOffers) {
      try {
        setOffers(JSON.parse(savedOffers));
      } catch {
        setOffers([]);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    if (allDimensions.length > 0) {
      localStorage.setItem(DIMENSIONS_KEY, JSON.stringify(allDimensions));
    }
  }, [allDimensions]);

  // Derived state
  const scoringDimensions = useMemo(() => 
    allDimensions.filter(d => d.active && d.id !== 'company'),
  [allDimensions]);

  const weights = useMemo(() => 
    calculateWeights(scoringDimensions),
  [scoringDimensions]);

  const results = useMemo(() => 
    calculateOfferScores(offers, allDimensions.filter(d => d.active), weights),
  [offers, allDimensions, weights]);

  // Actions
  const addOffer = () => {
    const newOffer: Offer = {
      id: crypto.randomUUID(),
      values: {},
      extraBonuses: []
    };
    setOffers(prev => [...prev, newOffer]);
  };

  const removeOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const toggleDimension = (id: string) => {
    setAllDimensions(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d));
  };

  const updateDimension = (id: string, updates: Partial<Dimension>) => {
    setAllDimensions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const reorderDimensions = (newOrder: string[]) => {
    const dimMap = new Map<string, Dimension>(allDimensions.map(d => [d.id, d]));
    const newDims: Dimension[] = [];
    
    newOrder.forEach(id => {
      const d = dimMap.get(id);
      if (d) {
        newDims.push(d);
        dimMap.delete(id);
      }
    });

    dimMap.forEach(d => newDims.push(d));
    setAllDimensions(newDims);
  };

  const addCustomDimension = (dim: Dimension) => {
    setAllDimensions(prev => [...prev, dim]);
  };

  const removeCustomDimension = (id: string) => {
    setAllDimensions(prev => prev.filter(d => d.id !== id));
  };

  const clearAll = () => {
    if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
      localStorage.removeItem(OFFERS_KEY);
      localStorage.removeItem(DIMENSIONS_KEY);
      setOffers([]);
      setAllDimensions([...DEFAULT_DIMENSIONS, ...OPTIONAL_DIMENSIONS]);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">工作Offer选择器</h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'offers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> Offer管理</span>
            </button>
            <button
              onClick={() => setActiveTab('dimensions')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dimensions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4"/> 维度 & 权重</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'results' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <span className="flex items-center gap-2"><ListTodo className="w-4 h-4"/> 对比分析</span>
            </button>
          </nav>

          <button 
            onClick={clearAll}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="清空所有数据"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Offer 列表</h2>
              <button
                onClick={addOffer}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                <PlusCircle className="w-5 h-5" /> 添加 Offer
              </button>
            </div>
            
            {offers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500">还没有添加任何 Offer，点击右上角开始吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {offers.map(offer => (
                  <OfferForm
                    key={offer.id}
                    offer={offer}
                    dimensions={allDimensions.filter(d => d.active)}
                    onUpdate={(updates) => updateOffer(offer.id, updates)}
                    onRemove={() => removeOffer(offer.id)}
                    score={results.find(r => r.offerId === offer.id)?.totalScore || 0}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DimensionManager
              dimensions={allDimensions}
              onToggle={toggleDimension}
              onAddCustom={addCustomDimension}
              onRemoveCustom={removeCustomDimension}
              onUpdateDimension={updateDimension}
            />
            <Ranker
              activeDimensions={scoringDimensions}
              onReorder={reorderDimensions}
              weights={weights}
            />
          </div>
        )}

        {activeTab === 'results' && (
          <ResultsView
            offers={offers}
            dimensions={allDimensions.filter(d => d.active)}
            results={results}
            weights={weights}
          />
        )}
      </main>
      
      {/* Floating Score Summary for Mobile */}
      {offers.length > 0 && activeTab !== 'results' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur shadow-2xl rounded-full px-6 py-3 border border-white/50 flex items-center gap-4 z-40 sm:hidden">
          <span className="text-sm font-medium text-slate-600">最佳匹配:</span>
          <span className="text-indigo-600 font-bold">{offers.find(o => o.id === results[0]?.offerId)?.values['company'] || '未命名'}</span>
          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs">{results[0]?.totalScore.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

export default App;
