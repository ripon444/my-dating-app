import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle, 
  DollarSign, 
  PhoneCall, 
  MessageSquare, 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  Clock,
  Layers,
  BarChart3,
  Loader2,
  Lock
} from 'lucide-react';
import { AdminAnalytics, ExternalProvider, ExternalSyncLog, Report } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

export const AdminView: React.FC = () => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'kpi' | 'providers' | 'moderation' | 'logs'>('kpi');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [providers, setProviders] = useState<ExternalProvider[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [syncLogs, setSyncLogs] = useState<ExternalSyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvUrl, setNewProvUrl] = useState('');
  const [newProvAttribution, setNewProvAttribution] = useState('');

  const loadData = async () => {
    try {
      const [analyticsData, providersData, reportsData, logsData] = await Promise.all([
        api.getAdminAnalytics(),
        api.getProviders(),
        api.getModerationQueue(),
        api.getSyncLogs(),
      ]);
      setAnalytics(analyticsData);
      setProviders(providersData.providers);
      setReports(reportsData.reports);
      setSyncLogs(logsData.logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncProvider = async (providerId: string) => {
    setIsSyncing((prev) => ({ ...prev, [providerId]: true }));
    try {
      await api.syncProvider(providerId);
      await loadData();
    } catch (err) {
      console.error('Provider sync error:', err);
    } finally {
      setIsSyncing((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName || !newProvUrl) return;

    try {
      await api.addProvider({
        name: newProvName,
        base_url: newProvUrl,
        attribution_requirement: newProvAttribution || `Licensed by ${newProvName}`,
        sync_interval_hours: 12,
      });
      setNewProvName('');
      setNewProvUrl('');
      setNewProvAttribution('');
      setShowAddProvider(false);
      await loadData();
    } catch (err) {
      console.error('Failed to add provider:', err);
    }
  };

  const handleModerationAction = async (reportId: string, action: string) => {
    try {
      await api.takeModerationAction(reportId, action);
      await loadData();
    } catch (err) {
      console.error('Moderation action error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-900/90 p-6 rounded-3xl border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-serif">{t('admin')} Command Center</h1>
            <p className="text-xs text-stone-400">
              Live Governance, Partner Feed Syndication & Safety Moderation
            </p>
          </div>
        </div>

        {/* Subtab navigation */}
        <div className="flex items-center bg-stone-800/80 p-1 rounded-xl border border-stone-700/60 text-xs font-semibold">
          {[
            { id: 'kpi', label: 'Platform KPIs', icon: BarChart3 },
            { id: 'providers', label: 'Partner Providers', icon: ExternalLink },
            { id: 'moderation', label: `Moderation (${reports.filter(r => r.status === 'PENDING').length})`, icon: AlertTriangle },
            { id: 'logs', label: 'Sync Logs', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-stone-400 hover:text-white hover:bg-stone-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Platform KPIs Tab */}
      {activeSubTab === 'kpi' && analytics && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow">
              <div className="text-[11px] font-semibold text-stone-400">Total Members</div>
              <div className="text-xl font-extrabold text-white mt-1">
                {analytics.totalUsers.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">+{analytics.newUsersToday} today</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow">
              <div className="text-[11px] font-semibold text-stone-400">Total Matches</div>
              <div className="text-xl font-extrabold text-rose-400 mt-1">
                {analytics.totalMatches.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Mutual Connections</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow">
              <div className="text-[11px] font-semibold text-stone-400">Real-time Calls</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {analytics.totalCalls.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Voice & Video WebRTC</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow">
              <div className="text-[11px] font-semibold text-stone-400">Partner Clicks</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">
                {analytics.externalProfileClicks.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">Licensed Deep Links</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow">
              <div className="text-[11px] font-semibold text-stone-400">Gross Revenue</div>
              <div className="text-xl font-extrabold text-amber-300 mt-1">
                ${analytics.totalRevenueUsd.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Stripe MRR & Boosts</div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow">
              <div className="text-[11px] font-semibold text-stone-400">Pending Safety Queue</div>
              <div className="text-xl font-extrabold text-rose-500 mt-1">
                {analytics.pendingReports}
              </div>
              <div className="text-[10px] text-rose-400 mt-0.5">Requires Review</div>
            </div>
          </div>

          {/* Profile Composition & Geographical Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Architecture Composition */}
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow space-y-4">
              <h3 className="font-bold text-white text-base font-serif">Profile Architecture Composition</h3>
              <p className="text-xs text-stone-400">
                Transparent segmentation between Native platform users and authorized syndicated partners.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                  <div className="text-xs font-bold text-rose-400">Native Platform Members</div>
                  <div className="text-2xl font-extrabold text-white">{analytics.nativeProfilesCount} Profiles</div>
                  <p className="text-[10px] text-stone-400">Direct registration, in-app messaging, calling</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="text-xs font-bold text-amber-400">Syndicated Partner Profiles</div>
                  <div className="text-2xl font-extrabold text-white">{analytics.externalProfilesCount} Profiles</div>
                  <p className="text-[10px] text-stone-400">Licensed REST feeds with attribution deep links</p>
                </div>
              </div>
            </div>

            {/* Geographical Distribution */}
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow space-y-4">
              <h3 className="font-bold text-white text-base font-serif">Member Registrations by Country</h3>
              <div className="space-y-2.5 pt-2">
                {analytics.registrationsByCountry.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-medium">{item.country}</span>
                    <div className="flex items-center gap-3 w-1/2">
                      <div className="flex-1 h-2 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full"
                          style={{ width: `${(item.count / 4120) * 100}%` }}
                        />
                      </div>
                      <span className="text-stone-400 font-mono text-[11px] w-12 text-right">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Partner Providers Management Tab */}
      {activeSubTab === 'providers' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Registered External Partner Providers</h2>
              <p className="text-xs text-stone-400">
                Manage authorized API endpoints, credentials, sync intervals, and attribution requirements.
              </p>
            </div>
            <button
              onClick={() => setShowAddProvider(!showAddProvider)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Partner Provider
            </button>
          </div>

          {/* Add Provider Form */}
          {showAddProvider && (
            <form onSubmit={handleCreateProvider} className="p-6 rounded-3xl bg-stone-900 border border-indigo-500/30 space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-white">Register New Partner API</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[11px] text-stone-400">Provider Name</label>
                  <input
                    type="text"
                    required
                    value={newProvName}
                    onChange={(e) => setNewProvName(e.target.value)}
                    placeholder="e.g. Sol Latino Dating Federation"
                    className="w-full mt-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400">Base API Feed URL</label>
                  <input
                    type="url"
                    required
                    value={newProvUrl}
                    onChange={(e) => setNewProvUrl(e.target.value)}
                    placeholder="https://api.partner.example.com/v1/feed"
                    className="w-full mt-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400">Attribution Notice</label>
                  <input
                    type="text"
                    value={newProvAttribution}
                    onChange={(e) => setNewProvAttribution(e.target.value)}
                    placeholder="e.g. Powered by Sol Latino Network"
                    className="w-full mt-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProvider(false)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Save & Register
                </button>
              </div>
            </form>
          )}

          {/* Providers List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((prov) => (
              <div key={prov.id} className="p-5 rounded-3xl bg-stone-900 border border-stone-800 shadow space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                      {prov.status}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Every {prov.sync_interval_hours} hrs
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base font-serif">{prov.name}</h3>
                  <div className="text-[11px] text-stone-400 font-mono truncate bg-stone-950 p-2 rounded-xl border border-stone-800/80">
                    {prov.base_url}
                  </div>

                  <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1">
                    <span>Active Profiles: <strong className="text-white">{prov.profile_count}</strong></span>
                    <span>API Key: <code className="text-stone-500">{prov.api_key_masked}</code></span>
                  </div>

                  <p className="text-[11px] text-amber-300/80 italic">
                    "{prov.attribution_requirement}"
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-500">
                    Last sync: {new Date(prov.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleSyncProvider(prov.id)}
                    disabled={isSyncing[prov.id]}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing[prov.id] ? 'animate-spin text-indigo-400' : ''}`} />
                    <span>{isSyncing[prov.id] ? 'Syncing...' : 'Sync Feed'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Safety Moderation Queue Tab */}
      {activeSubTab === 'moderation' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-white font-serif">Trust & Safety Moderation Queue</h2>
            <p className="text-xs text-stone-400">
              Review flagged accounts, toxic messages, and scam solicitations.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center bg-stone-900/50 rounded-3xl border border-stone-800 text-stone-400">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">Moderation Queue Clear</h3>
              <p className="text-xs">No pending user reports requiring administrative review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-xs font-bold">
                        {rep.category}
                      </span>
                      <span className="font-bold text-white text-sm">
                        Reported User: {rep.reported_user_name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        rep.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300">
                      <strong>Reason:</strong> {rep.reason}
                    </p>

                    {rep.notes && (
                      <p className="text-[11px] text-stone-400 italic">
                        {rep.notes}
                      </p>
                    )}

                    <div className="text-[10px] text-stone-500">
                      Report ID: {rep.id} • {new Date(rep.created_at).toLocaleString()}
                    </div>
                  </div>

                  {rep.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleModerationAction(rep.id, 'Warn User')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold transition"
                      >
                        Issue Warning
                      </button>
                      <button
                        onClick={() => handleModerationAction(rep.id, 'Ban Account')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
                      >
                        Ban & Suspend
                      </button>
                      <button
                        onClick={() => handleModerationAction(rep.id, 'Dismissed')}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-medium transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. External Sync Audit Logs Tab */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-white font-serif">Partner Feed Sync Audit History</h2>
            <p className="text-xs text-stone-400">
              Complete automated and manual synchronization execution history.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900 shadow">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Partner Provider</th>
                  <th className="p-3">Profiles Ingested</th>
                  <th className="p-3">Updated</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-800/40 transition">
                    <td className="p-3 font-mono text-stone-400">{log.id}</td>
                    <td className="p-3 font-semibold text-white">{log.provider_name}</td>
                    <td className="p-3 text-emerald-400 font-bold">+{log.profiles_fetched}</td>
                    <td className="p-3 text-amber-400">{log.profiles_updated}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-stone-400">{new Date(log.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
