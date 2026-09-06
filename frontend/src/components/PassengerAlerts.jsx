import React, { useState } from 'react';
import { Bell, AlertTriangle, Clock, MapPin, ArrowRight, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionHeader from './ui/SectionHeader';
import RailwayLoader from './ui/RailwayLoader';

const FILTERS = [
  { key: 'all', label: 'All Alerts' },
  { key: 'eta_update', label: 'ETA Changed' },
  { key: 'delay', label: 'Delay Increased' },
  { key: 'approaching', label: 'Train Approaching' },
  { key: 'arrived', label: 'Train Arrived' },
  { key: 'platform', label: 'Platform Changed' },
  { key: 'disruption', label: 'Journey Disruption' },
];

export default function PassengerAlerts({
  train,
  standalone = false,
  alerts: propAlerts,
  savedJourneys = [],
  onMarkRead,
  readAlertIds = [],
  onSelectTrain,
  loading = false,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Use train alerts if provided, otherwise use the passed alerts (from saved journeys)
  const trainAlerts = train?.alerts?.map((a, idx) => ({
    ...a,
    id: a.id || `train-${train.number}-${idx}`,
    type: a.type || 'eta_update',
    trainNumber: train.number,
    trainName: train.name,
    train: `${train.number} ${train.name}`,
    trainObj: train,
    station: a.station || train.currentStation || train.nextStation || 'En Route',
    message: a.reason || a.title || a.message || '',
    severity: a.severity || (a.impact?.includes('+') ? 'warning' : 'info'),
    time: a.time || 'Live Update',
  })) || [];

  const alerts = standalone ? (propAlerts || []) : trainAlerts;
  const filteredAlerts = activeFilter === 'all' ? alerts : alerts.filter(a => a.type === activeFilter);

  const getAlertBadge = (type, severity) => {
    switch (type) {
      case 'eta_update':
        return <Badge light variant="info">ETA Changed</Badge>;
      case 'delay':
        return <Badge light variant={severity === 'danger' ? 'danger' : 'warning'}>Delay Increased</Badge>;
      case 'approaching':
        return <Badge light variant="info">Train Approaching</Badge>;
      case 'arrived':
        return <Badge light variant="success">Train Arrived</Badge>;
      case 'platform':
        return <Badge light variant="info">Platform Changed</Badge>;
      case 'disruption':
        return <Badge light variant="danger">Journey Disruption</Badge>;
      default:
        return <Badge light variant={severity === 'danger' ? 'danger' : severity === 'warning' ? 'warning' : 'info'}>Notice</Badge>;
    }
  };

  const getAlertIcon = (type, severity) => {
    if (type === 'arrived') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (type === 'disruption' || severity === 'danger') return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    if (type === 'delay' || severity === 'warning') return <Clock className="w-4 h-4 text-amber-600" />;
    if (type === 'platform') return <MapPin className="w-4 h-4 text-blue-600" />;
    return <AlertTriangle className="w-4 h-4 text-[#1b56a0]" />;
  };

  const getCardStyle = (severity) => {
    if (severity === 'danger') return 'bg-[#fff5f5] border-[#fcd4d4] hover:border-red-300';
    if (severity === 'warning') return 'bg-[#fffbf0] border-[#fed7aa] hover:border-amber-300';
    if (severity === 'success') return 'bg-[#f0fdf4] border-[#bbf7d0] hover:border-emerald-300';
    return 'bg-[#f8fafc] border-[#e2e8f0] hover:border-blue-200';
  };

  if (loading) {
    return (
      <div className={standalone ? 'portal-page py-16 flex items-center justify-center' : 'py-12 flex items-center justify-center'}>
        <RailwayLoader
          fullPage
          message="Fetching Live Railway Alerts & Gateway Telemetry..."
          submessage="Scanning corridor signals, platform changes & delay notices"
        />
      </div>
    );
  }

  return (
    <div className={standalone ? 'portal-page space-y-6' : 'space-y-6'}>
      {standalone && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="portal-head-title">Passenger Alerts & Journey Notifications</h1>
            <p className="portal-head-sub flex flex-wrap items-center gap-1">
              Live AI-powered alerts for your tracked trains, delay changes, platform assignments & ETA updates.
            </p>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6b7f99]">
                {alerts.length} Total Alerts • {alerts.filter(a => !readAlertIds.includes(a.id)).length} Unread
              </span>
            </div>
          )}
        </div>
      )}

      {!standalone && (
        <SectionHeader
          light
          icon={Bell}
          iconColor="text-[#0d7a56]"
          title={`Alerts for #${train?.number || 'Train'}`}
          description="Live delay, platform berthing & ETA adjustments"
          badge={<span className="portal-chip">{filteredAlerts.length} Updates</span>}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const count = f.key === 'all' ? alerts.length : alerts.filter(a => a.type === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                activeFilter === f.key
                  ? 'bg-[#1b56a0] text-white border-[#1b56a0] shadow-sm'
                  : 'bg-[#f4f7fb] border-[#d9e2ed] text-[#6b7f99] hover:text-[#14253d] hover:border-[#a9c6eb]'
              }`}
            >
              <span>{f.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#475569]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card light>
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#14253d]">No Disruption Alerts in this Category</p>
            <p className="text-xs text-[#6b7f99] max-w-sm mx-auto">
              All tracked routes are running normally. We will notify you immediately if ETAs change or delays increase.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isUnread = onMarkRead && !readAlertIds.includes(alert.id);
            return (
              <div
                key={alert.id}
                onClick={() => onMarkRead?.(alert.id)}
                className={`p-4 rounded-xl border ${getCardStyle(alert.severity)} transition-all ${
                  isUnread ? 'ring-1 ring-amber-400/60 shadow-sm' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                      {getAlertIcon(alert.type, alert.severity)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      {/* Train & Station Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#1b56a0] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200">
                          #{alert.trainNumber || alert.train?.split(' ')[0] || 'TRAIN'}
                        </span>
                        <span className="font-bold text-sm text-[#14253d] truncate">
                          {alert.trainName || alert.train || 'Express'}
                        </span>
                        {alert.station && (
                          <span className="text-xs font-semibold text-[#6b7f99] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {alert.station}
                          </span>
                        )}
                      </div>

                      {/* Main Alert Message */}
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {alert.message || alert.reason || alert.title}
                      </p>

                      {/* Change Comparison Diff / Highlight (if available) */}
                      {alert.changeDiff && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/70 text-amber-900 text-xs font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{alert.changeDiff}</span>
                        </div>
                      )}

                      {/* Additional Details (e.g., Confidence or Delay Impact) */}
                      {alert.details && (
                        <p className="text-[11px] text-slate-500">
                          {alert.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="flex items-center gap-1.5">
                      {isUnread && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded uppercase">
                          New
                        </span>
                      )}
                      {getAlertBadge(alert.type, alert.severity)}
                    </div>

                    <span className="text-[11px] font-medium text-slate-400">
                      {alert.time || 'Live'}
                    </span>

                    {/* Track This Train CTA */}
                    {alert.trainObj && onSelectTrain && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrain(alert.trainObj);
                        }}
                        className="mt-1 px-2.5 py-1 rounded-md bg-[#1b56a0] hover:bg-[#154684] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span>Track Train</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}