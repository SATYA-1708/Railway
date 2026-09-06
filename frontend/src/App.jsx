import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import PassengerSearch from './components/PassengerSearch';
import PassengerMyTrain from './components/PassengerMyTrain';
import MyJourneys from './components/MyJourneys';
import PassengerAlerts from './components/PassengerAlerts';
import Profile from './components/Profile';
import StaffLogin from './components/StaffLogin';
import StaffOperationsDashboard from './components/StaffOperationsDashboard';
import StaffPlatformAlerts from './components/StaffPlatformAlerts';
import StaffWhatIfSimulator from './components/StaffWhatIfSimulator';
import StaffEtaPrediction from './components/StaffEtaPrediction';
import StaffTrains from './components/StaffTrains';
import StaffLiveMonitoring from './components/StaffLiveMonitoring';
import StaffAnalytics from './components/StaffAnalytics';
import StaffManagerProfile from './components/StaffManagerProfile';
import StaffSignallingPanel from './components/StaffSignallingPanel';
import StaffOperationalImpacts from './components/StaffOperationalImpacts';
import StaffShell from './components/StaffShell';
import LiveTrainMap from './components/LiveTrainMap';
import StationDisplayBoard from './components/StationDisplayBoard';
import PnrTracker from './components/PnrTracker';
import HowItWorks from './components/HowItWorks';
import ErrorBoundary from './components/ErrorBoundary';
import { useTrackedTrains } from './hooks/useTrackedTrains';
import { useStationTrains } from './hooks/useStationTrains';
import { REAL_TRAINS_DATABASE } from './data/realTrainsData';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import './i18n';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [staffTab, setStaffTab] = useState('dashboard');
  const [staffStation, setStaffStation] = useState('BZA');
  const [staffSelectedTrain, setStaffSelectedTrain] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedJourneys, setSavedJourneys] = useState(() => {
    try {
      const saved = localStorage.getItem('railflow_saved_journeys');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const defaultTrain = REAL_TRAINS_DATABASE.find(t => t.number === '20805');
    return defaultTrain ? [{ ...defaultTrain, savedAt: new Date().toISOString(), notificationsEnabled: true }] : [];
  });
  const [alertSubscriptions, setAlertSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('railflow_alert_subs');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('railflow_saved_journeys', JSON.stringify(savedJourneys));
    } catch {}
  }, [savedJourneys]);

  useEffect(() => {
    try {
      localStorage.setItem('railflow_alert_subs', JSON.stringify(alertSubscriptions));
    } catch {}
  }, [alertSubscriptions]);

  // Global scroll-to-top whenever view, tab, or selected train changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.scrollTop = 0;
  }, [currentView, staffTab, selectedTrain, staffSelectedTrain]);

  // Tracked trains: journeys + alert subscriptions + recent searches + selected train
  const trackedTrainNumbers = useMemo(() => {
    const nums = new Set();
    savedJourneys.forEach(j => { if (j.number) nums.add(String(j.number).replace('#', '').trim()); });
    alertSubscriptions.forEach(num => { const n = String(num).replace('#', '').trim(); if (n) nums.add(n); });
    recentSearches.forEach(s => { const n = String(s.number).replace('#', '').trim(); if (n) nums.add(n); });
    if (selectedTrain?.number) { const n = String(selectedTrain.number).replace('#', '').trim(); if (n) nums.add(n); }
    return Array.from(nums);
  }, [savedJourneys, alertSubscriptions, recentSearches, selectedTrain]);

  const {
    trains: liveTrains,
    loading: liveLoading,
    error: liveError,
    isFallback: isLiveFallback,
    lastUpdated: liveLastUpdated,
    refresh: refreshLiveTrains,
    trackedCount
  } = useTrackedTrains(trackedTrainNumbers);

  const [platformOverrides, setPlatformOverrides] = useState({});
  const [staffWhatIfTrain, setStaffWhatIfTrain] = useState(null);

  // Live per-station roster shared by the platform conflict & what-if sandbox
  const { trains: stationLiveTrains } = useStationTrains(staffStation, 30000);

  const whatIfTrains = useMemo(() => {
    const raw = (stationLiveTrains && stationLiveTrains.length > 0)
      ? stationLiveTrains.filter(t => t && (t.available !== false))
      : [];
    return raw.map(t => {
      if (platformOverrides[t.number] !== undefined) {
        return { ...t, assignedPlatform: platformOverrides[t.number] };
      }
      return t;
    });
  }, [stationLiveTrains, platformOverrides]);

  const trains = useMemo(() => {
    const raw = (liveTrains && liveTrains.length > 0)
      ? liveTrains.filter(t => t && (t.available !== false))
      : [];
    return raw.map(t => {
      if (platformOverrides[t.number] !== undefined) {
        return { ...t, assignedPlatform: platformOverrides[t.number] };
      }
      return t;
    });
  }, [liveTrains, platformOverrides]);

  // My Journeys state
  const findTrainByNumber = useCallback((number) => {
    return trains.find(t => String(t.number) === String(number)) || null;
  }, [trains]);

  const alertSourceTrains = useMemo(() => {
    const set = new Map();
    alertSubscriptions.forEach(num => {
      const t = findTrainByNumber(num);
      if (t && !set.has(num)) set.set(num, t);
    });
    savedJourneys.forEach(j => {
      if (j.notificationsEnabled === false) return;
      if (set.has(j.number)) return;
      set.set(j.number, findTrainByNumber(j.number) || j);
    });
    return Array.from(set.values());
  }, [alertSubscriptions, savedJourneys, findTrainByNumber]);

  const generateJourneyAlerts = useCallback((trainsList) => {
    const alerts = [];
    trainsList.forEach(j => {
      const delay = j.delayMin ?? j.baseDelayMin ?? j.delay ?? 0;
      const trainNumber = String(j.number || '').replace('#', '');
      const trainName = j.name || 'Express';
      const stn = j.nextStation || j.currentStation || j.destinationStation || 'En Route';

      // 1. ETA Adjustment Alert
      if (delay > 0) {
        alerts.push({
          id: `eta-diff-${trainNumber}-${delay}`,
          type: 'eta_update',
          severity: delay > 20 ? 'warning' : 'info',
          title: `ETA Adjusted for #${trainNumber}`,
          trainNumber,
          trainName,
          train: `${trainNumber} ${trainName}`,
          trainObj: j,
          station: stn,
          time: 'Live NTES',
          changeDiff: `Delay: +${delay}m • ETA Revised`,
          message: `AI ETA Model adjusted arrival at ${stn} due to section speed limits.`,
          details: `Confidence: ${j.confidenceScore || 92}% • Scheduled vs Live tracked.`
        });
      }

      // 2. Delay Alert / Disruption Alert
      if (delay >= 30) {
        alerts.push({
          id: `disruption-${trainNumber}-${delay}`,
          type: 'disruption',
          severity: 'danger',
          title: `Major Delay / Section Disruption`,
          trainNumber,
          trainName,
          train: `${trainNumber} ${trainName}`,
          trainObj: j,
          station: stn,
          time: 'Active Telemetry',
          changeDiff: `Late by ${delay} mins`,
          message: `High delay reported on corridor. Expect extended travel time.`,
          details: `Signals queued ahead. Alternative dispatch being routed.`
        });
      } else if (delay > 0) {
        alerts.push({
          id: `delay-${trainNumber}-${delay}`,
          type: 'delay',
          severity: delay > 15 ? 'warning' : 'info',
          title: `Train #${trainNumber} Delay Update`,
          trainNumber,
          trainName,
          train: `${trainNumber} ${trainName}`,
          trainObj: j,
          station: stn,
          time: 'Live Telemetry',
          changeDiff: `+${delay} min delay`,
          message: `Running ${delay} min behind schedule. Live tracking available.`,
        });
      }

      // 3. Platform Assignment Alert
      if (j.assignedPlatform || j.platform) {
        const pf = j.assignedPlatform || j.platform;
        alerts.push({
          id: `pf-${trainNumber}-${pf}`,
          type: 'platform',
          severity: 'info',
          title: `Berthing Platform Confirmed`,
          trainNumber,
          trainName,
          train: `${trainNumber} ${trainName}`,
          trainObj: j,
          station: stn,
          time: 'Interlocking Live',
          changeDiff: `Platform ${pf} Locked`,
          message: `Train #${trainNumber} scheduled to berth on Platform ${pf}.`,
        });
      }

      // 4. Approaching / Arrived Alert
      if (j.status === 'BERTHED' || j.status === 'ARRIVED') {
        alerts.push({
          id: `arrived-${trainNumber}`,
          type: 'arrived',
          severity: 'success',
          title: `Train Arrived at Platform`,
          trainNumber,
          trainName,
          train: `${trainNumber} ${trainName}`,
          trainObj: j,
          station: j.currentStation || stn,
          time: 'Just Now',
          changeDiff: `At Platform ${j.assignedPlatform || 1}`,
          message: `Train #${trainNumber} ${trainName} has arrived at ${j.currentStation || stn}.`,
        });
      } else {
        alerts.push({
          id: `approaching-${trainNumber}`,
          type: 'approaching',
          severity: 'info',
          title: `Train Approaching ${stn}`,
          trainNumber,
          trainName,
          train: `${trainNumber} ${trainName}`,
          trainObj: j,
          station: stn,
          time: 'En Route',
          changeDiff: `Next Stop: ${stn}`,
          message: `Train #${trainNumber} is approaching ${stn} corridor block section.`,
        });
      }
    });
    return alerts;
  }, []);

  const passengerAlerts = useMemo(() => generateJourneyAlerts(alertSourceTrains), [alertSourceTrains, generateJourneyAlerts]);
  const [readAlertIds, setReadAlertIds] = useState([]);

  const handleMarkAlertRead = useCallback((alertId) => {
    setReadAlertIds(prev => prev.includes(alertId) ? prev : [...prev, alertId]);
  }, []);

  const unreadAlertCount = passengerAlerts.filter(a => !readAlertIds.includes(a.id)).length;

  const handleSelectTrain = (trainObj) => {
    setSelectedTrain(trainObj);
    if (!recentSearches.some(s => s.number === trainObj.number)) {
      setRecentSearches(prev => [trainObj, ...prev.slice(0, 4)]);
    }
    setCurrentView('passenger-mytrain');
  };

  const handleSaveJourney = (trainObj) => {
    const num = String(trainObj.number || '').replace('#', '').trim();
    const master = REAL_TRAINS_DATABASE.find(t => String(t.number) === num) || {};
    const fullTrain = { ...master, ...trainObj, savedAt: new Date().toISOString(), notificationsEnabled: true };
    setSavedJourneys(prev => {
      if (prev.some(j => String(j.number).replace('#', '').trim() === num)) return prev;
      return [...prev, fullTrain];
    });
  };

  const handleRemoveJourney = (trainNumber) => {
    const cleanNum = String(trainNumber || '').replace('#', '').trim();
    setSavedJourneys(prev => prev.filter(j => String(j.number || '').replace('#', '').trim() !== cleanNum));
    setAlertSubscriptions(prev => prev.filter(n => String(n).replace('#', '').trim() !== cleanNum));
  };

  const handleToggleNotification = (trainNumber) => {
    const cleanNum = String(trainNumber || '').replace('#', '').trim();
    setSavedJourneys(prev => prev.map(j => {
      const jNum = String(j.number || '').replace('#', '').trim();
      if (jNum === cleanNum) {
        const currentlyActive = j.notificationsEnabled !== false;
        return { ...j, notificationsEnabled: !currentlyActive };
      }
      return j;
    }));
  };

  const handleToggleAlertSubscription = (trainObj) => {
    const num = trainObj.number;
    setAlertSubscriptions(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const isJourneySaved = selectedTrain ? savedJourneys.some(j => j.number === selectedTrain.number) : false;
  const isAlertSubscribed = selectedTrain ? alertSubscriptions.includes(selectedTrain.number) : false;

  const [authenticatedStaffUser, setAuthenticatedStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem('railflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Check persisted session on mount
  useEffect(() => {
    const token = localStorage.getItem('railflow_token');
    if (token) {
      setIsStaffLoggedIn(true);
    }
  }, []);

  const handleStaffLoginSuccess = (userData) => {
    setIsStaffLoggedIn(true);
    setStaffTab('dashboard');
    setStaffSelectedTrain(null);
    setStaffWhatIfTrain(null);
    if (userData) {
      setAuthenticatedStaffUser(userData);
      if (userData.stationCode) {
        setStaffStation(userData.stationCode);
      }
    }
    setCurrentView('staff-portal');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleStaffLogout = () => {
    setIsStaffLoggedIn(false);
    setAuthenticatedStaffUser(null);
    setStaffTab('dashboard');
    setStaffSelectedTrain(null);
    setStaffWhatIfTrain(null);
    localStorage.removeItem('railflow_token');
    localStorage.removeItem('railflow_user');
    setCurrentView('landing');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const navigate = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const isStaffView = ['staff-login', 'staff-portal'].includes(currentView);

  return (
    <ErrorBoundary>
      <div className={`flex flex-col font-sans ${isStaffView ? 'min-h-screen bg-gradient-to-b from-[#070d1a] via-[#0a1424] to-[#0d1a2e] text-slate-100' : 'passenger-shell'}`}>
        {!isStaffView && (
          <Navbar
            currentView={currentView}
            onNavigate={navigate}
            isStaffLoggedIn={isStaffLoggedIn}
            onStaffLogout={handleStaffLogout}
            alertCount={unreadAlertCount}
          />
        )}

        {/* Fallback Warning Banner if NTES is offline */}
        {isLiveFallback && (
          <div className={`px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 ${isStaffView ? 'bg-amber-950/80 border-b border-amber-600/60 text-amber-300' : 'bg-amber-100 border-b border-amber-300 text-amber-900'}`}>
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isStaffView ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>Live NTES feed unreachable — no live train data available right now.</span>
            <button
              onClick={refreshLiveTrains}
              className={`ml-2 underline flex items-center gap-1 font-bold ${isStaffView ? 'text-amber-200 hover:text-white' : 'text-amber-800 hover:text-amber-950'}`}
            >
              <RefreshCw className="w-3 h-3" /> Retry Sync
            </button>
          </div>
        )}

        <main className={`flex-1 w-full ${isStaffView ? 'px-4 sm:px-6 lg:px-8 pt-3 pb-8' : ''}`}>
          {/* 1. HOME */}
          {currentView === 'landing' && (
            <LandingPage
              onCheckTrain={() => setCurrentView('passenger-search')}
              onStaffLogin={() => setCurrentView(isStaffLoggedIn ? 'staff-portal' : 'staff-login')}
              onSelectTrain={handleSelectTrain}
              trains={trains}
              savedJourneys={savedJourneys}
              recentSearches={recentSearches}
              loading={liveLoading}
            />
          )}

          {/* 2. TRACK TRAIN (Search) */}
          {currentView === 'passenger-search' && (
            <PassengerSearch
              trains={trains}
              onSelectTrain={handleSelectTrain}
              onAddTrackedTrain={(trainObj) => {
                if (!recentSearches.some(s => s.number === trainObj.number)) {
                  setRecentSearches(prev => [trainObj, ...prev.slice(0, 4)]);
                }
              }}
              recentSearches={recentSearches}
              loading={liveLoading}
            />
          )}

          {/* 2B. GIS NETWORK MAP */}
          {currentView === 'live-map' && (
            <div className="space-y-4">
              <LiveTrainMap
                trains={trains}
                selectedTrainNumber={selectedTrain?.number}
                onSelectTrain={handleSelectTrain}
                height="calc(100vh - 160px)"
                loading={liveLoading}
              />
            </div>
          )}

          {/* 2C. IRCTC PNR STATUS */}
          {currentView === 'pnr-tracker' && (
            <PnrTracker
              onTrackTrain={(num) => {
                const f = findTrainByNumber(num);
                if (f) handleSelectTrain(f);
              }}
              onSaveJourney={handleSaveJourney}
              savedJourneys={savedJourneys}
            />
          )}

          {/* 2D. STATION DIGITAL DISPLAY BOARD MODE */}
          {(currentView === 'station-display' || currentView === 'station-board' || currentView === 'station-live') && (
            <StationDisplayBoard
              onSelectTrain={(train) => {
                if (train) handleSelectTrain(train);
              }}
            />
          )}

          {/* 3. TRACK TRAIN (Live Tracking View) */}
          {currentView === 'passenger-mytrain' && (
            <PassengerMyTrain
              train={selectedTrain || trains[0]}
              onBackToSearch={() => setCurrentView('passenger-search')}
              onSaveJourney={handleSaveJourney}
              isJourneySaved={isJourneySaved}
              onToggleAlert={handleToggleAlertSubscription}
              isAlertSubscribed={isAlertSubscribed}
              onRefreshTrain={(updated) => {
                setSelectedTrain(updated);
              }}
              loading={liveLoading && !selectedTrain}
            />
          )}

          {/* 4. MY JOURNEYS */}
          {currentView === 'my-journeys' && (
            <MyJourneys
              savedJourneys={savedJourneys}
              onSelectTrain={handleSelectTrain}
              onRemoveJourney={handleRemoveJourney}
              onToggleNotification={handleToggleNotification}
              onAddJourney={() => setCurrentView('passenger-search')}
              recentSearches={recentSearches}
              loading={liveLoading && savedJourneys.length === 0}
            />
          )}

          {/* 5. ALERTS */}
          {currentView === 'passenger-alerts' && (
            <PassengerAlerts
              alerts={passengerAlerts}
              savedJourneys={savedJourneys}
              standalone={true}
              onMarkRead={handleMarkAlertRead}
              readAlertIds={readAlertIds}
              onSelectTrain={handleSelectTrain}
              loading={liveLoading && passengerAlerts.length === 0}
            />
          )}

          {/* 6. PROFILE */}
          {currentView === 'profile' && (
            <Profile
              onLogout={() => { setIsStaffLoggedIn(false); setCurrentView('landing'); }}
              savedJourneyCount={savedJourneys.length}
            />
          )}

          {/* STAFF — LOGIN */}
          {currentView === 'staff-login' && (
            <StaffLogin onLoginSuccess={handleStaffLoginSuccess} onCancel={() => setCurrentView('landing')} />
          )}

          {/* STAFF — MANAGER PORTAL */}
          {currentView === 'staff-portal' && (
            <StaffShell
              activeTab={staffTab}
              onTabChange={setStaffTab}
              stationCode={staffStation}
              onStationChange={setStaffStation}
              isLive={!isLiveFallback && liveTrains.length > 0}
              lastUpdated={liveLastUpdated}
              onRefresh={refreshLiveTrains}
              loading={liveLoading}
              userName={authenticatedStaffUser?.name || 'Station Manager'}
              user={authenticatedStaffUser}
              onLogout={handleStaffLogout}
              onSwitchToPassenger={() => setCurrentView('landing')}
            >
              {staffTab === 'dashboard' && (
                <StaffOperationsDashboard
                  activeStation={staffStation}
                  onStationChange={setStaffStation}
                  onSelectTrainForDetails={(t) => {
                    setStaffSelectedTrain(t);
                    setStaffTab('trains');
                  }}
                  onSelectTrainForEta={(t) => {
                    setStaffSelectedTrain(t);
                    setStaffTab('eta');
                  }}
                  onSelectTrainForWhatIf={(t) => {
                    setStaffWhatIfTrain(t?.number || null);
                    setStaffTab('what-if');
                  }}
                  onSelectPlatformBerth={() => {
                    setStaffTab('platforms');
                  }}
                />
              )}

              {staffTab === 'live-map' && (
                <StaffLiveMonitoring
                  stationCode={staffStation}
                  onSelectTrainForDetails={(t) => {
                    setStaffSelectedTrain(t);
                    setStaffTab('trains');
                  }}
                  onSelectTrainForEta={(t) => {
                    setStaffSelectedTrain(t);
                    setStaffTab('eta');
                  }}
                />
              )}

              {staffTab === 'trains' && (
                <StaffTrains
                  stationCode={staffStation}
                  selectedTrainProp={staffSelectedTrain}
                  onSelectTrainForEta={(t) => {
                    setStaffSelectedTrain(t);
                    setStaffTab('eta');
                  }}
                  onSelectTrainForLive={(t) => {
                    setStaffSelectedTrain(t);
                    setStaffTab('live-map');
                  }}
                />
              )}

              {staffTab === 'what-if' && (
                <StaffWhatIfSimulator
                  trains={whatIfTrains}
                  activeStation={staffStation}
                  initialTrainNumber={staffWhatIfTrain}
                  onStationChange={setStaffStation}
                  onApplyDispatch={({ trainNumber, newPlatform }) => {
                    setPlatformOverrides(prev => ({ ...prev, [trainNumber]: newPlatform }));
                  }}
                />
              )}

              {staffTab === 'tsr' && (
                <StaffOperationalImpacts
                  activeStation={staffStation}
                  user={authenticatedStaffUser}
                />
              )}

              {staffTab === 'platforms' && (
                <StaffPlatformAlerts
                  trains={trains}
                  activeStation={staffStation}
                  onStationChange={setStaffStation}
                  onOpenWhatIf={(t) => {
                    setStaffWhatIfTrain(t?.number || null);
                    setStaffTab('what-if');
                  }}
                  onApplyDispatch={({ trainNumber, newPlatform }) => {
                    setPlatformOverrides(prev => ({ ...prev, [trainNumber]: newPlatform }));
                  }}
                />
              )}

              {staffTab === 'signals' && (
                <StaffSignallingPanel
                  activeStation={staffStation}
                  onStationChange={setStaffStation}
                />
              )}

              {staffTab === 'eta' && (
                <StaffEtaPrediction
                  activeStation={staffStation}
                  initialTrain={staffSelectedTrain}
                  onSelectTrain={setStaffSelectedTrain}
                  onOpenWhatIf={(t) => {
                    if (t) setStaffWhatIfTrain(t?.number || null);
                    setStaffTab('what-if');
                  }}
                />
              )}

              {staffTab === 'analytics' && (
                <StaffAnalytics activeStation={staffStation} />
              )}

              {staffTab === 'profile' && (
                <StaffManagerProfile
                  stationCode={staffStation}
                  user={authenticatedStaffUser}
                  onStationChange={setStaffStation}
                  onLogout={handleStaffLogout}
                />
              )}
            </StaffShell>
          )}

          {/* 7. HOW IT WORKS / AI ENGINE */}
          {currentView === 'how-it-works' && (
            <HowItWorks onTryNow={() => setCurrentView('passenger-search')} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
