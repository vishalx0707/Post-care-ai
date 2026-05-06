'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Greeting } from '@/components/synex/Greeting';
import { Eyebrow } from '@/components/synex/Eyebrow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatTime = (time) => {
  if (!time) return '—';
  const [h, m = '00'] = String(time).split(':');
  const hh = Number(h), mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return String(time);
  return new Date(2000, 0, 1, hh, mm).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const normalizeDose = (d) => d ? {
  id: d.id || d.medicationId || d.medication?.id,
  medicationId: d.medicationId || d.medication?.id || d.id,
  name: d.name || d.medication?.name || 'Medication',
  dosage: d.dosage || d.medication?.dosage || '',
  instructions: d.instructions || d.medication?.instructions || d.medication?.description || '',
  time: d.time || d.medication?.time,
} : null;

const getReportTitle = (r) => r?.reportName || r?.name || r?.title || r?.fileName || 'Untitled report';
const getCreatedAt = (i) => {
  const v = i?.createdAt || i?.created_at || i?.uploadedAt || i?.uploaded_at;
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v?._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
  if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000).toISOString();
  return null;
};
const formatDate = (v) => {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const isTakenToday = (m) => {
  const log = Array.isArray(m?.takenLog) ? m.takenLog : [];
  const t = todayKey();
  return log.some((e) => String((typeof e === 'string' ? e : e?.date || e?.takenAt) || '').startsWith(t));
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, authFetch, profile } = useAuth();
  const [dashboard, setDashboard] = useState({ medications: [], schedules: [], reports: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickAsk, setQuickAsk] = useState('');
  const [savingMedicationId, setSavingMedicationId] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const data = await authFetch('/api/dashboard');
    if (!data) {
      setError('Could not load your day yet.');
      setDashboard({ medications: [], schedules: [], reports: [], stats: {} });
      setLoading(false);
      return;
    }
    setDashboard({
      medications: Array.isArray(data.medications) ? data.medications : [],
      schedules: Array.isArray(data.schedules) ? data.schedules : [],
      reports: Array.isArray(data.reports) ? data.reports : [],
      stats: data.stats || {},
    });
    setLoading(false);
  }, [authFetch, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadDashboard();
  }, [authLoading, loadDashboard, user]);

  const today = useMemo(() => new Date(), []);
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const nextDose = useMemo(() => {
    const api = normalizeDose(dashboard.stats?.nextDose);
    if (api) return api;
    const meds = dashboard.medications
      .filter((m) => m?.status !== 'deleted' && !isTakenToday(m))
      .flatMap((m) => {
        const times = Array.isArray(m.times) && m.times.length > 0 ? m.times : [m.time].filter(Boolean);
        return times.map((time) => ({
          id: m.id, medicationId: m.id, name: m.name || 'Medication', dosage: m.dosage || '',
          instructions: m.instructions || m.description || '', time, sort: String(time || '99:99'),
        }));
      })
      .sort((a, b) => a.sort.localeCompare(b.sort));
    return meds[0] || null;
  }, [dashboard.medications]);

  const recentReports = useMemo(() => [...dashboard.reports]
    .sort((a, b) => (getCreatedAt(b) || '').localeCompare(getCreatedAt(a) || ''))
    .slice(0, 3), [dashboard.reports]);

  const routineTotal = Number(dashboard.stats?.today?.medicationDosesTotal ?? dashboard.stats?.routineTotal ?? dashboard.stats?.totalTasks ?? dashboard.schedules?.length ?? 0);
  const routineDone = Number(dashboard.stats?.today?.medicationDosesTaken ?? dashboard.stats?.routineCompleted ?? dashboard.stats?.completedTasks ?? 0);
  const routinePct = Number(dashboard.stats?.today?.progressPercent ?? (routineTotal > 0 ? Math.min(100, Math.round((routineDone / routineTotal) * 100)) : 0));

  const companionName = profile?.aiCompanionName || 'AI Companion';
  const userName = profile?.displayName || '';
  const userFirst = userName.split(' ')[0] || '';

  const handleMarkTaken = async () => {
    const id = nextDose?.medicationId || nextDose?.id;
    if (!id || savingMedicationId) return;
    setSavingMedicationId(id);
    setError('');
    const result = await authFetch('/api/medications', {
      method: 'PATCH',
      body: JSON.stringify({ medicationId: id, takenAt: todayKey() }),
    });
    if (!result) setError('Could not mark that dose as taken.');
    else await loadDashboard();
    setSavingMedicationId('');
  };

  const handleQuickAsk = (e) => {
    e.preventDefault();
    const m = quickAsk.trim();
    router.push(`/dashboard/companion${m ? `?message=${encodeURIComponent(m)}` : ''}`);
  };

  // Companion's morning note — derived from real state
  const companionNote = useMemo(() => {
    if (!routineTotal && !nextDose && recentReports.length === 0) {
      return `Hi${userFirst ? `, ${userFirst}` : ''}. I’m here whenever you’re ready — tell me how you’re feeling, or what’s on your plate today.`;
    }
    if (nextDose) {
      return `${userFirst ? userFirst + ', y' : 'Y'}our next is ${nextDose.name} at ${formatTime(nextDose.time)}. ${routineDone > 0 ? `You’ve already handled ${routineDone} of ${routineTotal} today — nice pace.` : 'Whenever you’re ready.'}`;
    }
    return `${userFirst ? userFirst + ', n' : 'N'}othing scheduled right now. Want to plan the rest of the day together?`;
  }, [userFirst, routineDone, routineTotal, nextDose, recentReports.length]);

  return (
    <div className="flex flex-col gap-16">
      {/* Masthead */}
      <header className="grid md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-9">
          <div className="flex items-center gap-3 mb-4">
            <span className="pulse-dot" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">{dateStr.toUpperCase()}</span>
          </div>
          <Greeting name={userFirst} />
        </div>
        {loading && <div className="md:col-span-3 md:text-right"><Skeleton width="120px" /></div>}
      </header>

      {error && (
        <div className="border border-danger px-4 py-3 text-sm text-danger font-mono uppercase tracking-wide text-[11px] rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Companion's note */}
      <section className="grid md:grid-cols-12 gap-8 border-t border-rule pt-12">
        <div className="md:col-span-3">
          <Eyebrow>FROM {companionName.toUpperCase()}</Eyebrow>
          <p className="text-ink-3 text-sm mt-2 italic">a quiet check-in.</p>
        </div>
        <div className="md:col-span-8 md:col-start-5">
          <p className="companion-voice--lg max-w-[44ch]">
            “{companionNote}”
          </p>
        </div>
      </section>

      {/* Today */}
      <section className="grid md:grid-cols-12 gap-x-8 gap-y-12 border-t border-rule pt-12">
        <div className="md:col-span-3">
          <Eyebrow>TODAY</Eyebrow>
          <p className="text-ink-3 text-sm mt-2 italic">how it’s shaping up.</p>
        </div>

        <div className="md:col-span-8 md:col-start-5 space-y-12">
          {/* Routine */}
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-serif text-6xl md:text-7xl text-ink tabular-nums leading-none">{routineDone}</span>
              <span className="font-serif italic text-2xl text-ink-3 tabular-nums">of {routineTotal}</span>
              <span className="font-serif italic text-xl text-ink-3 ml-2">things done.</span>
            </div>
            <div className="h-1 bg-rule rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ width: `${routinePct}%` }} />
            </div>
          </div>

          {/* Next dose */}
          <div>
            <Eyebrow className="mb-3">NEXT</Eyebrow>
            {nextDose ? (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="font-mono text-xl text-ink tabular-nums">{formatTime(nextDose.time)}</span>
                <span className="font-serif italic text-2xl text-ink">{nextDose.name}</span>
                <span className="text-ink-3 text-sm">{nextDose.dosage}</span>
                <Button
                  variant="link"
                  onClick={handleMarkTaken}
                  disabled={savingMedicationId === (nextDose.medicationId || nextDose.id)}
                  className="text-accent ml-2"
                >
                  {savingMedicationId === (nextDose.medicationId || nextDose.id) ? 'Saving…' : 'I took it ✓'}
                </Button>
              </div>
            ) : (
              <p className="text-ink-3">
                Nothing on deck.{' '}
                <Link href="/dashboard/medications" className="text-accent underline underline-offset-4">
                  Add a medication →
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Recent reports */}
      <section className="grid md:grid-cols-12 gap-x-8 gap-y-6 border-t border-rule pt-12">
        <div className="md:col-span-3">
          <Eyebrow>RECENT</Eyebrow>
          <p className="text-ink-3 text-sm mt-2 italic">what we’ve been reading.</p>
        </div>
        <div className="md:col-span-8 md:col-start-5">
          {recentReports.length > 0 ? (
            <ul>
              {recentReports.map((r, i) => (
                <li key={i} className="border-t border-rule first:border-t-0">
                  <Link href="/dashboard/reports" className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-4 hover:text-accent transition-colors group">
                    <span className="font-serif text-lg">{getReportTitle(r)}</span>
                    <span className="font-mono text-xs text-ink-3 tabular-nums">{formatDate(getCreatedAt(r))}</span>
                    <ChevronRight size={16} strokeWidth={1.5} className="text-ink-3 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-3">
              No reports yet.{' '}
              <Link href="/dashboard/reports" className="text-accent underline underline-offset-4">
                Drop one in →
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Ask */}
      <section className="grid md:grid-cols-12 gap-x-8 gap-y-6 border-t border-rule pt-12">
        <div className="md:col-span-3">
          <Eyebrow>SAY SOMETHING</Eyebrow>
          <p className="text-ink-3 text-sm mt-2 italic">to {companionName}.</p>
        </div>
        <div className="md:col-span-8 md:col-start-5">
          <form onSubmit={handleQuickAsk} className="flex items-center gap-4 border-b-2 border-ink pb-2">
            <Input
              type="text"
              placeholder="how are you feeling today?"
              value={quickAsk}
              onChange={(e) => setQuickAsk(e.target.value)}
              className="text-lg font-serif italic flex-1 border-0"
              id="ai-quick-ask"
            />
            <Button type="submit" variant="ghost" size="icon" aria-label="Send to companion" className="text-accent">
              <ArrowRight size={20} strokeWidth={1.5} />
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
