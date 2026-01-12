import { Offer, Dimension, ScoringResult } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { Trophy, HelpCircle, Star, Calculator, AlertTriangle } from 'lucide-react';

interface ResultsViewProps {
  offers: Offer[];
  dimensions: Dimension[];
  results: ScoringResult[];
  weights: Record<string, number>;
}

const ResultsView: React.FC<ResultsViewProps> = ({ offers, dimensions, results, weights }) => {
  if (offers.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500">添加一些 Offer 来查看对比分析</p>
      </div>
    );
  }

  const barData = results.map(r => {
    const offer = offers.find(o => o.id === r.offerId);
    return {
      name: offer?.values['company'] || '未命名',
      score: Number(r.totalScore.toFixed(1))
    };
  });

  const radarDimensions = dimensions.filter(d => d.id !== 'company' && !d.isPenalty).slice(0, 6);
  const radarData = radarDimensions.map(dim => {
    const entry: any = { subject: dim.name };
    results.slice(0, 3).forEach(r => {
      const offer = offers.find(o => o.id === r.offerId);
      entry[offer?.values['company'] || '工作机会'] = r.dimensionScores[dim.id];
    });
    return entry;
  });

  return (
    <div className="space-y-10">
      {/* Global Calculation Rule */}
      <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-200 overflow-hidden relative group">
        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Calculator className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
            <Calculator className="w-6 h-6" /> 核心评分机制
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm opacity-90">
            <div className="space-y-2">
              <p className="font-semibold text-indigo-100">最终评分公式：</p>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 font-mono text-xs">
                总分 = 基础分 + 额外分 <br/>
                基础分 = Σ(维度得分_i × 权重_i) <br/>
                * 基础分包含正向得分与负向扣分
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-indigo-100">核心维度计分：</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-indigo-50">
                <li><span className="font-bold">扣分项：</span>老板PUA等负面指标会直接产生负分</li>
                <li><span className="font-bold">分值范围：</span>正向 0~100，负向 0~-100</li>
                <li><span className="font-bold">权重计算：</span>根据排序自动分配 (越靠前越高)</li>
                <li><span className="font-bold text-rose-300">警示：</span>总分低于60分时会自动标记为风险 Offer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">得分总览</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 'auto']} hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  formatter={(value) => [`${value} 分`, '总分']}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={24} name="评分">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score < 60 ? '#e11d48' : '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">正向核心维度对比 (前三强)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                {results.slice(0, 3).map((r, i) => {
                  const offer = offers.find(o => o.id === r.offerId);
                  const colors = ['#4f46e5', '#10b981', '#f59e0b'];
                  const name = offer?.values['company'] || `Offer ${i+1}`;
                  return (
                    <Radar
                      key={r.offerId}
                      name={name}
                      dataKey={name}
                      stroke={colors[i]}
                      fill={colors[i]}
                      fillOpacity={0.3}
                    />
                  );
                })}
                <Legend iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">详细得分细则</h3>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded">
              <Star className="w-3 h-3 fill-amber-500" /> 额外加分项已计入
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">排名</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">公司 / Offer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">最终总分</th>
                {dimensions.filter(d => d.id !== 'company').map(dim => (
                  <th key={dim.id} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest min-w-[120px] ${dim.isPenalty ? 'text-rose-400' : 'text-slate-400'}`}>
                    <div className="group relative cursor-help inline-flex items-center gap-1">
                      {dim.name}
                      <HelpCircle className="w-3 h-3 opacity-50" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-800 text-white text-[9px] p-2 rounded leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity z-10 font-normal">
                        {dim.isPenalty ? '扣分项 • ' : '加分项 • '} 权重: {(weights[dim.id] * 100).toFixed(1)}%
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((res, index) => {
                const offer = offers.find(o => o.id === res.offerId);
                const isRisk = res.totalScore < 60;
                return (
                  <tr key={res.offerId} className={`hover:bg-slate-50/30 transition-colors ${isRisk ? 'bg-rose-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      {index === 0 ? (
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-amber-600" />
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold ml-3">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${isRisk ? 'text-rose-900' : 'text-slate-900'}`}>{offer?.values['company'] || '未命名'}</p>
                        {isRisk && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black ${isRisk ? 'text-rose-600' : 'text-indigo-600'}`}>{res.totalScore.toFixed(1)}</span>
                        {res.bonusScore > 0 && (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                            +{res.bonusScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </td>
                    {dimensions.filter(d => d.id !== 'company').map(dim => {
                      const score = res.dimensionScores[dim.id];
                      const bonusObj = offer?.extraBonuses.find(b => b.dimensionId === dim.id);
                      return (
                        <td key={dim.id} className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className={`font-medium ${score < 0 ? 'text-rose-600' : 'text-slate-600'}`}>{score?.toFixed(0) || 0}</span>
                              {bonusObj && (
                                <span className="text-[9px] text-amber-500 font-bold">+{bonusObj.points}分</span>
                              )}
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-700 ${dim.isPenalty ? 'bg-rose-500' : (score || 0) > 80 ? 'bg-emerald-500' : (score || 0) > 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.abs(score || 0)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
