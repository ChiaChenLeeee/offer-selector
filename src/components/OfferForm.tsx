import { useState } from 'react';
import { Offer, Dimension, SalaryData, WorkloadData, LocationData } from '../types';
import { Trash2, HelpCircle, Edit3, Calculator, ChevronDown, ChevronUp, AlertCircle, Star } from 'lucide-react';
import { calculateYearlySalary, calculateWeeklyWorkload } from '../utils/scoring';

interface OfferFormProps {
  offer: Offer;
  dimensions: Dimension[];
  onUpdate: (updates: Partial<Offer>) => void;
  onRemove: () => void;
  score: number;
}

const OfferForm: React.FC<OfferFormProps> = ({ offer, dimensions, onUpdate, onRemove, score }) => {
  const [showFormula, setShowFormula] = useState(false);

  const handleValueChange = (dimId: string, value: any) => {
    onUpdate({
      values: { ...offer.values, [dimId]: value }
    });
  };

  const toggleBonus = (dimId: string) => {
    const exists = offer.extraBonuses.find(b => b.dimensionId === dimId);
    if (exists) {
      onUpdate({
        extraBonuses: offer.extraBonuses.filter(b => b.dimensionId !== dimId)
      });
    } else if (offer.extraBonuses.length < 3) {
      onUpdate({
        extraBonuses: [...offer.extraBonuses, { dimensionId: dimId, points: 0 }]
      });
    }
  };

  const updateBonusPoints = (dimId: string, points: number) => {
    onUpdate({
      extraBonuses: offer.extraBonuses.map(b => b.dimensionId === dimId ? { ...b, points } : b)
    });
  };

  const scoringDims = dimensions.filter(d => d.id !== 'company');

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4">
          <div className="relative group/name">
            <input
              type="text"
              value={offer.values['company'] || ''}
              onChange={e => handleValueChange('company', e.target.value)}
              placeholder="输入公司/职位名称"
              className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none w-full transition-all py-1"
            />
            {!offer.values['company'] && (
              <Edit3 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none opacity-0 group-hover/name:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-black tracking-tight ${score < 60 ? 'text-rose-600' : 'text-indigo-600'}`}>
                {score.toFixed(1)}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">综合总分</span>
                <button 
                  onClick={() => setShowFormula(!showFormula)}
                  className="flex items-center gap-0.5 text-[10px] text-indigo-500 font-bold hover:text-indigo-600 transition-colors mt-0.5"
                >
                  <Calculator className="w-2.5 h-2.5" />
                  查看计算公式 {showFormula ? <ChevronUp className="w-2.5 h-2.5"/> : <ChevronDown className="w-2.5 h-2.5"/>}
                </button>
              </div>
            </div>
            
            {showFormula && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] leading-relaxed text-slate-500">
                <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> 计算逻辑说明
                </div>
                <ul className="space-y-1 list-disc list-inside">
                  <li><span className="font-semibold">总分 =</span> 基础得分 + 额外加分</li>
                  <li><span className="font-semibold">基础得分 =</span> Σ(维度得分 × 维度权重)</li>
                  <li>维度得分包含<span className="text-rose-500 font-bold">负分(扣分项)</span>，会拉低权重后的均值</li>
                  <li><span className="font-semibold">额外加分 =</span> Σ(加分分值 × 该维度权重)</li>
                  <li><span className="text-rose-500 font-bold">扣分项不支持额外加分</span></li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
          title="删除此Offer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5">
        {scoringDims.map(dim => {
          const value = offer.values[dim.id];
          const isBonus = offer.extraBonuses.some(b => b.dimensionId === dim.id);
          const bonusObj = offer.extraBonuses.find(b => b.dimensionId === dim.id);

          const isRatingSelect = dim.type === 'select' && dim.options?.length === 5 && dim.options.every(o => ['1','2','3','4','5'].includes(o.value));

          return (
            <div key={dim.id} className={`group relative p-3 -mx-3 rounded-2xl transition-colors ${dim.isPenalty ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-sm font-semibold flex items-center gap-1.5 ${dim.isPenalty ? 'text-rose-700' : 'text-slate-700'}`}>
                  {dim.isPenalty && <AlertCircle className="w-3.5 h-3.5" />}
                  {dim.name}
                  {dim.isPenalty && <span className="text-[10px] bg-rose-200 text-rose-700 px-1 rounded">扣分项</span>}
                  {dim.description && (
                    <div className="group/tip relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-10">
                        {dim.description}
                      </div>
                    </div>
                  )}
                </label>
                
                {!dim.isPenalty && (
                  <button
                    onClick={() => toggleBonus(dim.id)}
                    disabled={!isBonus && offer.extraBonuses.length >= 3}
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded transition-all ${
                      isBonus 
                        ? 'bg-amber-100 text-amber-600' 
                        : offer.extraBonuses.length >= 3 
                          ? 'opacity-0' 
                          : 'bg-white/50 text-slate-400 hover:bg-amber-50 hover:text-amber-500 border border-slate-100'
                    }`}
                  >
                    {isBonus ? '已加分' : '+ 额外加分'}
                  </button>
                )}
              </div>

              {dim.type === 'location' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <input
                    type="text"
                    value={(value as LocationData)?.city || ''}
                    onChange={e => handleValueChange(dim.id, { ...(value || {}), city: e.target.value })}
                    placeholder="输入城市名称"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:border-indigo-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    {dim.options?.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleValueChange(dim.id, { ...(value || {}), preference: opt.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          (value as LocationData)?.preference === opt.value
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {dim.type === 'salary' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">月薪 (元)</span>
                      <input
                        type="number"
                        value={(value as SalaryData)?.monthly || ''}
                        onChange={e => handleValueChange(dim.id, { ...value, monthly: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">月份</span>
                      <input
                        type="number"
                        value={(value as SalaryData)?.months || ''}
                        onChange={e => handleValueChange(dim.id, { ...value, months: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">额外奖励/年终 (元)</span>
                    <input
                      type="number"
                      value={(value as SalaryData)?.bonus || ''}
                      onChange={e => handleValueChange(dim.id, { ...value, bonus: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">预估年薪</span>
                    <span className="text-sm font-black text-indigo-600">
                      ¥{(calculateYearlySalary((value as SalaryData) || { monthly: 0, months: 0, bonus: 0 }) / 10000).toFixed(1)}w
                    </span>
                  </div>
                </div>
              )}

              {dim.type === 'workload' && (
                <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">每日工时</span>
                      <input
                        type="number"
                        value={(value as WorkloadData)?.hoursPerDay || ''}
                        onChange={e => handleValueChange(dim.id, { ...value, hoursPerDay: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">每周天数</span>
                      <input
                        type="number"
                        value={(value as WorkloadData)?.daysPerWeek || ''}
                        onChange={e => handleValueChange(dim.id, { ...value, daysPerWeek: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">每周总工时</span>
                    <span className="text-sm font-black text-indigo-600">
                      {calculateWeeklyWorkload((value as WorkloadData) || { hoursPerDay: 0, daysPerWeek: 0 })} 小时
                    </span>
                  </div>
                </div>
              )}

              {dim.type === 'select' && (
                <div className={`flex flex-wrap gap-2 ${isRatingSelect ? 'justify-between' : ''}`}>
                  {dim.options?.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleValueChange(dim.id, opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1 ${
                        value === opt.value
                          ? dim.isPenalty ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      } ${isRatingSelect ? 'flex-1 justify-center py-2' : ''}`}
                    >
                      {isRatingSelect && <Star className={`w-3 h-3 ${value === opt.value ? 'fill-white' : 'fill-slate-300'}`} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {dim.type === 'numeric' && (
                <input
                  type="number"
                  value={value || ''}
                  onChange={e => handleValueChange(dim.id, Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                />
              )}

              {dim.type === 'slider' && (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value || 50}
                    onChange={e => handleValueChange(dim.id, Number(e.target.value))}
                    className={`flex-1 ${dim.isPenalty ? 'accent-rose-600' : 'accent-indigo-600'}`}
                  />
                  <span className="text-sm font-black text-slate-700 w-8 text-center">{value || 50}</span>
                </div>
              )}

              {!dim.isPenalty && isBonus && (
                <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">额外加分 (0-100)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bonusObj?.points || 0}
                      onChange={e => updateBonusPoints(dim.id, Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 px-2 py-1 bg-white border border-amber-200 rounded-lg text-sm text-center font-bold text-amber-600 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OfferForm;
