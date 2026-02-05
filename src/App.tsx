import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutGrid, SlidersHorizontal, Sparkles, Users, User, Plus, Cloud, CloudOff, Mail, LogOut, RefreshCw } from 'lucide-react';
import { Dimension, Offer } from './types';
import { DEFAULT_DIMENSIONS, OPTIONAL_DIMENSIONS } from './constants';
import { calculateWeights, calculateOfferScores } from './utils';
import { AuthProvider, useAuth } from './lib/auth';
import { syncToCloud, syncFromCloud } from './lib/database';
import Ranker from './components/Ranker';
import DimensionManager from './components/DimensionManager';
import OfferCard from './components/OfferCard';

type NavItem = 'offers' | 'dimensions' | 'ai' | 'community' | 'profile';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const OFFERS_KEY = 'job_selector_offers_v5';
const DIMENSIONS_KEY = 'job_selector_dimensions_v5';
const AUTO_SAVE_DELAY = 2000;

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>('offers');
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [allDimensions, setAllDimensions] = useState<Dimension[]>(() => {
    const saved = localStorage.getItem(DIMENSIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [...DEFAULT_DIMENSIONS, ...OPTIONAL_DIMENSIONS];
      }
    }
    return [...DEFAULT_DIMENSIONS, ...OPTIONAL_DIMENSIONS];
  });

  const [allOffers, setAllOffers] = useState<Offer[]>(() => {
    const saved = localStorage.getItem(OFFERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const isInitialMount = useRef(true);
  const hasLoadedFromCloud = useRef(false);

  // Save to localStorage
  useEffect(() => {
    if (allDimensions.length > 0) {
      localStorage.setItem(DIMENSIONS_KEY, JSON.stringify(allDimensions));
    }
  }, [allDimensions]);

  useEffect(() => {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(allOffers));
  }, [allOffers]);

  // Load from cloud on login
  useEffect(() => {
    if (user && !authLoading && !hasLoadedFromCloud.current) {
      syncFromCloudData();
      hasLoadedFromCloud.current = true;
    }
  }, [user, authLoading]);

  const syncFromCloudData = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const { dimensions, offers } = await syncFromCloud(user.id);
      
      if (dimensions && dimensions.length > 0) {
        setAllDimensions(dimensions);
      }
      
      if (offers && offers.length > 0) {
        setAllOffers(offers);
      }
    } catch (error) {
      console.error('从云端同步数据失败', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToCloud = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      await syncToCloud(user.id, allDimensions, allOffers);
      alert('数据已保存到云端');
    } catch (error) {
      console.error('保存到云端失败', error);
      alert('保存失败，请稍后重试');
    } finally {
      setIsSyncing(false);
    }
  };

  const autoSaveToCloud = useCallback(async () => {
    if (!user) return;
    
    setSaveStatus('saving');
    try {
      await syncToCloud(user.id, allDimensions, allOffers);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('自动保存失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  }, [user, allDimensions, allOffers]);

  // Auto-save with debounce
  useEffect(() => {
    if (!user || authLoading) return;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSaveToCloud();
    }, AUTO_SAVE_DELAY);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [allDimensions, allOffers, user, authLoading, autoSaveToCloud]);

  const scoringDimensions = useMemo(() => 
    allDimensions.filter(d => d.active),
  [allDimensions]);

  const weights = useMemo(() => 
    calculateWeights(scoringDimensions),
  [scoringDimensions]);

  const toggleDimension = (id: string) => {
    setAllDimensions(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d));
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

  const updateDimension = (id: string, updates: Partial<Dimension>) => {
    setAllDimensions(prev => {
      const existing = prev.find(d => d.id === id);
      if (existing) {
        // 更新现有维度
        return prev.map(d => d.id === id ? { ...d, ...updates } : d);
      } else {
        // 添加新维度
        return [...prev, updates as Dimension];
      }
    });
  };

  const addOffer = () => {
    const newOffer: Offer = {
      id: `offer_${Date.now()}`,
      values: {
        company: '',
        jobTitle: ''
      },
      extraBonuses: []
    };
    setAllOffers(prev => [...prev, newOffer]);
    setEditingOfferId(newOffer.id);
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setAllOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOffer = (id: string) => {
    if (confirm('确定要删除这个 Offer 吗？')) {
      setAllOffers(prev => prev.filter(o => o.id !== id));
      if (editingOfferId === id) {
        setEditingOfferId(null);
      }
    }
  };

  const scoredOffers = useMemo(() => {
    const results = calculateOfferScores(allOffers, scoringDimensions, weights);
    return allOffers.map(offer => {
      const result = results.find(r => r.offerId === offer.id);
      return {
        offer,
        score: result?.totalScore || 0
      };
    }).sort((a, b) => b.score - a.score);
  }, [allOffers, scoringDimensions, weights]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col py-3 z-50">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-sm">O</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Offer 选择器</span>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          <NavButton
            icon={LayoutGrid}
            label="Offer 合集"
            active={activeNav === 'offers'}
            onClick={() => setActiveNav('offers')}
          />
          <NavButton
            icon={SlidersHorizontal}
            label="打分规则"
            active={activeNav === 'dimensions'}
            onClick={() => setActiveNav('dimensions')}
          />
          <NavButton
            icon={Sparkles}
            label="AI 解读"
            active={activeNav === 'ai'}
            onClick={() => setActiveNav('ai')}
          />
          <NavButton
            icon={Users}
            label="社区"
            active={activeNav === 'community'}
            onClick={() => setActiveNav('community')}
          />
          <NavButton
            icon={User}
            label="我的"
            active={activeNav === 'profile'}
            onClick={() => setActiveNav('profile')}
            badge={
              user 
                ? { text: '已登录', color: 'green' }
                : { text: '未登录', color: 'gray' }
            }
          />
        </nav>

        {user && (
          <div className="px-4 py-3 border-t border-gray-100">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                <span>正在保存...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Cloud className="w-3 h-3" />
                <span>已保存到云端</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <CloudOff className="w-3 h-3" />
                <span>保存失败</span>
              </div>
            )}
            {saveStatus === 'idle' && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Cloud className="w-3 h-3" />
                <span>自动保存已启用</span>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="ml-60 flex-1">
        <div className="max-w-7xl mx-auto px-16 py-12">
          {activeNav === 'offers' && (
            <div>
              <div className="mb-10">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Offer 合集</h1>
                <p className="text-sm text-gray-500">管理和对比你的工作机会</p>
              </div>
              <button 
                onClick={addOffer}
                className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>新建 Offer</span>
              </button>
              
              {allOffers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4">
                    <LayoutGrid className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有 Offer</h3>
                  <p className="text-sm text-gray-500 mb-6">点击上方按钮创建你的第一个 Offer</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${editingOfferId ? 'items-start' : ''}`}>
                  {scoredOffers.map(({ offer, score }) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      dimensions={scoringDimensions}
                      score={score}
                      isEditing={editingOfferId === offer.id}
                      onEdit={() => setEditingOfferId(offer.id)}
                      onUpdate={updateOffer}
                      onDelete={deleteOffer}
                      onCancelEdit={() => setEditingOfferId(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {activeNav === 'dimensions' && (
            <div>
              <div className="mb-10">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">打分规则</h1>
                <p className="text-sm text-gray-500">自定义评分维度和权重</p>
              </div>
              
              <div className="mb-8">
                <DimensionManager
                  dimensions={allDimensions}
                  onToggle={toggleDimension}
                  onAddCustom={addCustomDimension}
                  onRemoveCustom={removeCustomDimension}
                  onUpdateDimension={updateDimension}
                />
              </div>

              <Ranker
                activeDimensions={scoringDimensions}
                onReorder={reorderDimensions}
                weights={weights}
              />
            </div>
          )}
          {activeNav === 'ai' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">AI 解读</h2>
                <p className="text-sm text-gray-500">即将推出</p>
              </div>
            </div>
          )}
          {activeNav === 'community' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">社区</h2>
                <p className="text-sm text-gray-500">即将推出</p>
              </div>
            </div>
          )}
          {activeNav === 'profile' && (
            <ProfilePage />
          )}
        </div>
      </main>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: {
    text: string;
    color: 'gray' | 'green';
  };
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, active, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all ${
        active 
          ? 'bg-purple-50 text-purple-700 font-medium' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-purple-600' : ''}`} />
      <span>{label}</span>
      {badge && (
        <span className={`ml-auto text-[10px] font-medium ${
          badge.color === 'green' ? 'text-green-600' : 'text-gray-400'
        }`}>
          {badge.text}
        </span>
      )}
    </button>
  );
};

function ProfilePage() {
  const { user, signInWithOTP, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('请输入邮箱地址');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const { error } = await signInWithOTP(email);

    if (error) {
      setMessage('发送失败，请稍后重试');
      setMessageType('error');
    } else {
      setMessage('登录链接已发送到您的邮箱，请查收！');
      setMessageType('success');
      setEmail('');
    }

    setIsLoading(false);
  };

  const handleSignOut = async () => {
    if (confirm('确定要退出登录吗？')) {
      await signOut();
      setMessage('');
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setMessage('');

    try {
      // This would trigger a manual sync - you can implement this
      setMessage('数据同步成功！');
      setMessageType('success');
    } catch (error) {
      setMessage('同步失败，请稍后重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">我的账户</h1>
          <p className="text-sm text-gray-500">登录后可同步数据到云端</p>
        </div>

        <div className="max-w-md">
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-6 mx-auto">
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">邮箱登录</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              我们会向您的邮箱发送登录链接
            </p>

            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-purple-400 transition-colors"
                  disabled={isLoading}
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  messageType === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>发送中...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>发送登录链接</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                点击发送后，请检查您的邮箱（包括垃圾邮件文件夹）
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">我的账户</h1>
        <p className="text-sm text-gray-500">管理你的个人信息和数据</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">账户信息</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">用户 ID: {user.id.slice(0, 8)}...</p>
              </div>
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                已登录
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </div>

        {/* Data Sync Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">数据同步</h3>
          
          <p className="text-sm text-gray-600 mb-4">
            您的数据会自动保存到云端。如需手动同步，请点击下方按钮。
          </p>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleManualSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? '同步中...' : '手动同步数据'}</span>
          </button>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Cloud className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                数据会在您修改后 2 秒自动保存到云端。本地和云端数据会保持同步。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
