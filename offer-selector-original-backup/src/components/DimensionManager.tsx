import { useState } from 'react';
import { Dimension, DimensionType, DimensionOption, DimensionCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { 
  Check, Plus, X, Settings2, Info, ChevronDown, 
  ChevronUp, Sliders, AlertCircle, 
  Trash2, Edit2
} from 'lucide-react';

interface DimensionManagerProps {
  dimensions: Dimension[];
  onToggle: (id: string) => void;
  onAddCustom: (dim: Dimension) => void;
  onRemoveCustom: (id: string) => void;
  onUpdateDimension: (id: string, updates: Partial<Dimension>) => void;
}

const DimensionManager: React.FC<DimensionManagerProps> = ({ 
  dimensions, onToggle, onAddCustom, onRemoveCustom, onUpdateDimension 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [newDim, setNewDim] = useState<Partial<Dimension>>({
    name: '',
    type: 'numeric',
    category: 'objective',
    active: true,
    isDefault: false,
    isPenalty: false
  });

  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [editingOption, setEditingOption] = useState<{ dimId: string, optValue: string, label: string } | null>(null);

  const translateType = (type: string) => {
    switch (type) {
      case 'numeric': return '数值';
      case 'slider': return '滑动条';
      case 'text': return '文本';
      case 'salary': return '薪资';
      case 'workload': return '工时';
      case 'location': return '地点';
      case 'select': return '选择';
      default: return type;
    }
  };

  const calculateAutoScores = (options: DimensionOption[], isPenalty: boolean): DimensionOption[] => {
    const m = options.length;
    if (m === 0) return [];
    if (m === 1) return [{ ...options[0], score: isPenalty ? -100 : 100 }];

    return options.map((opt, index) => {
      const score = isPenalty 
        ? Math.round(-100 * (m - 1 - index) / (m - 1))
        : Math.round(100 * (m - 1 - index) / (m - 1));
      return { ...opt, score };
    });
  };


  const handleAdd = () => {
    if (!newDim.name) return;
    const isPenalty = newDim.isPenalty || false;
    
    let initialOptions: DimensionOption[] | undefined = undefined;
    if (newDim.type === 'select') {
      initialOptions = isPenalty ? [
        { label: '经常', value: 'yes', score: -100 },
        { label: '偶尔', value: 'maybe', score: -50 },
        { label: '从不', value: 'no', score: 0 }
      ] : [
        { label: '极好', value: 'best', score: 100 },
        { label: '一般', value: 'avg', score: 50 },
        { label: '极差', value: 'worst', score: 0 }
      ];
    }

    onAddCustom({
      id: `custom_${Date.now()}`,
      name: newDim.name,
      type: newDim.type as DimensionType,
      category: newDim.category as DimensionCategory,
      active: true,
      isDefault: false,
      isPenalty: isPenalty,
      options: initialOptions
    } as Dimension);
    
    setNewDim({ name: '', type: 'numeric', category: 'objective', active: true, isDefault: false, isPenalty: false });
    setShowAddForm(false);
  };

  const handleAddOption = (dimId: string) => {
    if (!newOptionLabel.trim()) return;
    const dim = dimensions.find(d => d.id === dimId);
    if (!dim || !dim.options) return;

    const newOptions = [...dim.options, { 
      label: newOptionLabel.trim(), 
      value: `opt_${Date.now()}`, 
      score: 0 
    }];
    
    onUpdateDimension(dimId, { 
      options: calculateAutoScores(newOptions, !!dim.isPenalty) 
    });
    setNewOptionLabel('');
  };

  const handleRemoveOption = (dimId: string, optValue: string) => {
    const dim = dimensions.find(d => d.id === dimId);
    if (!dim || !dim.options) return;

    const newOptions = dim.options.filter(o => o.value !== optValue);
    onUpdateDimension(dimId, { 
      options: calculateAutoScores(newOptions, !!dim.isPenalty) 
    });
  };

  const handleReorderOptions = (dimId: string, fromIndex: number, toIndex: number) => {
    const dim = dimensions.find(d => d.id === dimId);
    if (!dim || !dim.options) return;

    const newOptions = [...dim.options];
    const [removed] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, removed);
    
    onUpdateDimension(dimId, { 
      options: calculateAutoScores(newOptions, !!dim.isPenalty) 
    });
  };

  const handleSaveOptionLabel = () => {
    if (!editingOption || !editingOption.label.trim()) return;
    const dim = dimensions.find(d => d.id === editingOption.dimId);
    if (!dim || !dim.options) return;

    const newOptions = dim.options.map(o => 
      o.value === editingOption.optValue ? { ...o, label: editingOption.label.trim() } : o
    );
    onUpdateDimension(editingOption.dimId, { options: newOptions });
    setEditingOption(null);
  };

  // 按分类分组
  const categories: DimensionCategory[] = ['objective', 'subjective', 'personal'];
  const groupedDimensions = categories.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    colors: CATEGORY_COLORS[cat],
    dimensions: dimensions.filter(d => d.category === cat)
  }));


  const renderDimensionItem = (dim: Dimension, colors: typeof CATEGORY_COLORS.objective) => {
    const hasOptions = (dim.type === 'select' || dim.type === 'location') && dim.options && dim.options.length > 0;
    const isExpanded = expandedDim === dim.id;

    return (
      <div
        key={dim.id}
        className={`rounded-2xl border transition-all overflow-hidden ${
          dim.active 
            ? dim.isPenalty 
              ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-50' 
              : `${colors.light} ${colors.border} ring-2 ${colors.ring} shadow-sm` 
            : 'bg-slate-50 border-slate-100 grayscale opacity-70'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggle(dim.id)}
              disabled={dim.id === 'company'}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                dim.active 
                  ? dim.isPenalty ? 'bg-rose-600 text-white' : `${colors.bg} text-white` 
                  : 'bg-slate-200 text-slate-400'
              } ${dim.id === 'company' ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {dim.active && <Check className="w-4 h-4" />}
            </button>
            <div className="cursor-pointer" onClick={() => hasOptions && setExpandedDim(isExpanded ? null : dim.id)}>
              <p className={`text-sm font-bold flex items-center gap-1.5 ${dim.active ? dim.isPenalty ? 'text-rose-800' : 'text-slate-800' : 'text-slate-400'}`}>
                {dim.isPenalty && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                {dim.name}
                {hasOptions && (isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}
              </p>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                {translateType(dim.type)} {dim.isPenalty && '• 扣分'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasOptions && (
              <button 
                onClick={() => setExpandedDim(isExpanded ? null : dim.id)}
                className={`p-1.5 rounded-lg transition-colors ${isExpanded ? `${colors.light} ${colors.text}` : 'text-slate-300 hover:text-slate-500'}`}
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}
            {!dim.isDefault && (
              <button
                onClick={() => onRemoveCustom(dim.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isExpanded && hasOptions && (
          <div className={`px-4 pb-4 pt-2 border-t space-y-3 ${dim.isPenalty ? 'border-rose-100 bg-rose-100/30' : `${colors.border} ${colors.light}/50`}`}>
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${dim.isPenalty ? 'text-rose-500' : colors.text}`}>
                子选项管理 & 权重排序
              </p>
            </div>
            
            <div className="space-y-2">
              {dim.options?.map((opt, index) => (
                <div key={opt.value} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm group/opt">
                  <div className="flex flex-col gap-1 text-slate-300">
                    <button onClick={() => handleReorderOptions(dim.id, index, index - 1)} disabled={index === 0} className={`hover:${colors.text} disabled:opacity-0`}>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleReorderOptions(dim.id, index, index + 1)} disabled={index === (dim.options?.length || 0) - 1} className={`hover:${colors.text} disabled:opacity-0`}>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    {editingOption?.optValue === opt.value ? (
                      <div className="flex items-center gap-1 w-full mr-2">
                        <input 
                          type="text"
                          autoFocus
                          value={editingOption.label}
                          onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                          onBlur={handleSaveOptionLabel}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveOptionLabel()}
                          className={`flex-1 text-xs font-bold text-slate-700 bg-slate-50 ${colors.border} rounded px-2 py-1 outline-none`}
                        />
                      </div>
                    ) : (
                      <span 
                        className={`text-xs font-bold text-slate-700 truncate cursor-pointer hover:${colors.text} flex items-center gap-1`}
                        onClick={() => setEditingOption({ dimId: dim.id, optValue: opt.value, label: opt.label })}
                      >
                        {opt.label}
                        <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                      </span>
                    )}
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${opt.score < 0 ? 'bg-rose-100 text-rose-600' : `${colors.light} ${colors.text}`}`}>
                        {opt.score > 0 ? `+${opt.score}` : opt.score}分
                      </span>
                      <button 
                        onClick={() => handleRemoveOption(dim.id, opt.value)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/opt:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input 
                type="text"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddOption(dim.id)}
                placeholder="新增选项..."
                className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:${colors.border}`}
              />
              <button 
                onClick={() => handleAddOption(dim.id)}
                className={`${colors.bg} text-white p-2 rounded-xl hover:opacity-90`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-600" /> 维度配置
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
          title="新增自定义维度"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* 按分类显示维度 */}
      <div className="space-y-6">
        {groupedDimensions.map(group => (
          group.dimensions.length > 0 && (
            <div key={group.category}>
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${group.colors.border}`}>
                <div className={`w-3 h-3 rounded-full ${group.colors.bg}`}></div>
                <h4 className={`text-sm font-bold ${group.colors.text}`}>{group.label}</h4>
                <span className="text-xs text-slate-400">({group.dimensions.length})</span>
              </div>
              <div className="space-y-3">
                {group.dimensions.map(dim => renderDimensionItem(dim, group.colors))}
              </div>
            </div>
          )
        ))}
      </div>

      {showAddForm && (
        <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-700 mb-4">创建自定义维度</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">维度名称</label>
              <input
                type="text"
                value={newDim.name}
                onChange={e => setNewDim({ ...newDim, name: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                placeholder="例如：餐补、是否外企..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">所属分类</label>
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewDim({ ...newDim, category: cat })}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      newDim.category === cat 
                        ? `${CATEGORY_COLORS[cat].bg} text-white border-transparent` 
                        : `bg-white ${CATEGORY_COLORS[cat].border} ${CATEGORY_COLORS[cat].text} hover:${CATEGORY_COLORS[cat].light}`
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">输入类型</label>
              <select
                value={newDim.type}
                onChange={e => setNewDim({ ...newDim, type: e.target.value as DimensionType })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
              >
                <option value="numeric">数值输入</option>
                <option value="slider">滑动条 (0-100)</option>
                <option value="select">选择器 (支持子权重排序)</option>
                <option value="text">纯文本 (不参与评分)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="isPenalty"
                checked={newDim.isPenalty}
                onChange={e => setNewDim({ ...newDim, isPenalty: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <label htmlFor="isPenalty" className="text-sm font-bold text-slate-600 cursor-pointer">设为扣分维度</label>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdd}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700"
              >
                确认添加
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-white text-slate-600 py-2 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-700 leading-relaxed">
          <p className="font-bold mb-1">分类说明：</p>
          <ul className="space-y-1">
            <li><span className="text-blue-600 font-bold">🔵 岗位客观事实</span> - 可量化、可验证的硬性条件</li>
            <li><span className="text-purple-600 font-bold">🟣 岗位主观因素</span> - 需要判断的软性条件</li>
            <li><span className="text-emerald-600 font-bold">🟢 个人自身理想</span> - 与个人规划相关</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DimensionManager;
