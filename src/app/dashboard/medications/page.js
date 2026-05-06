'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Eyebrow } from '@/components/synex/Eyebrow';
import { Hairline } from '@/components/synex/Hairline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const initialForm = { name: '', dosage: '', frequency: 'Daily', time: '08:00', instructions: '', description: '' };
const todayKey = () => new Date().toISOString().slice(0, 10);

const formatTime = (time) => {
  if (!time) return '—';
  const [h, m = '00'] = String(time).split(':');
  const hh = Number(h), mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return String(time);
  return new Date(2000, 0, 1, hh, mm).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getPeriod = (time) => {
  const h = Number(String(time || '').split(':')[0]);
  if (Number.isNaN(h)) return 'Unscheduled';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

const isTakenToday = (m) => {
  const log = Array.isArray(m?.takenLog) ? m.takenLog : [];
  const t = todayKey();
  return log.some((e) => String((typeof e === 'string' ? e : e?.date || e?.takenAt) || '').startsWith(t));
};

const getMedicationTimes = (m) => {
  if (Array.isArray(m?.times) && m.times.length > 0) return m.times;
  if (m?.time) return [m.time];
  return [null];
};

export default function MedicationsPage() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [savingDoseKey, setSavingDoseKey] = useState('');

  const loadMedications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const data = await authFetch('/api/medications');
    if (!data) {
      setError('Could not load your medications.');
      setMedications([]); setLoading(false); return;
    }
    setMedications(Array.isArray(data.medications) ? data.medications : []);
    setLoading(false);
  }, [authFetch, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadMedications();
  }, [authLoading, loadMedications, user]);

  const schedule = useMemo(() => {
    const groups = new Map();
    medications.forEach((m) => {
      getMedicationTimes(m).forEach((time) => {
        const p = getPeriod(time);
        if (!groups.has(p)) groups.set(p, []);
        groups.get(p).push({ medication: m, time });
      });
    });
    const order = ['Morning', 'Afternoon', 'Evening', 'Unscheduled'];
    return order.filter((p) => groups.has(p)).map((p) => ({
      period: p,
      meds: groups.get(p).sort((a, b) => String(a.time || '99:99').localeCompare(String(b.time || '99:99'))),
    }));
  }, [medications]);

  const handleFormChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dosage.trim() || savingPrescription) {
      setError('Name and dosage are required.');
      return;
    }
    setSavingPrescription(true);
    setError('');
    const result = await authFetch('/api/medications', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name, dosage: form.dosage, frequency: form.frequency,
        instructions: form.instructions, description: form.description,
        times: form.time ? [form.time] : [],
      }),
    });
    if (!result) setError('Could not add that prescription.');
    else { setForm(initialForm); setIsAdding(false); await loadMedications(); }
    setSavingPrescription(false);
  };

  const handleMarkTaken = async (m, time) => {
    if (!m?.id || isTakenToday(m)) return;
    const k = `${m.id}-${time || 'dose'}`;
    setSavingDoseKey(k);
    setError('');
    const r = await authFetch('/api/medications', {
      method: 'PATCH',
      body: JSON.stringify({ medicationId: m.id, takenAt: todayKey() }),
    });
    if (!r) setError('Could not mark that dose as taken.');
    else await loadMedications();
    setSavingDoseKey('');
  };

  return (
    <div className="flex flex-col gap-12">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow className="mb-3">MEDICATIONS</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight tracking-[-0.02em]">The schedule.</h1>
          <p className="text-ink-3 mt-2 text-sm">
            {loading ? 'Loading…' : `${medications.length} active prescription${medications.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        <Button variant="link" onClick={() => setIsAdding((p) => !p)} className="text-accent">
          {isAdding ? 'Cancel' : '+ Add prescription'}
        </Button>
      </header>

      {error && (
        <div className="border border-danger px-4 py-3 text-sm text-danger font-mono uppercase tracking-wide text-[11px]" role="alert">
          {error}
        </div>
      )}

      <AnimatePresence initial={false}>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddPrescription} className="border-t border-b border-rule py-8">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <Field label="Name"><Input name="name" value={form.name} onChange={handleFormChange} placeholder="Medication name" required /></Field>
                <Field label="Dosage"><Input name="dosage" value={form.dosage} onChange={handleFormChange} placeholder="e.g. 500mg" required /></Field>
                <Field label="Frequency"><Input name="frequency" value={form.frequency} onChange={handleFormChange} /></Field>
                <Field label="Time"><Input name="time" type="time" value={form.time} onChange={handleFormChange} /></Field>
                <div className="md:col-span-2"><Field label="Instructions"><Input name="instructions" value={form.instructions} onChange={handleFormChange} placeholder="Food, timing, notes" /></Field></div>
                <div className="md:col-span-2"><Field label="Description"><Input name="description" value={form.description} onChange={handleFormChange} placeholder="What this medication is for" /></Field></div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={savingPrescription}>
                  {savingPrescription ? 'Saving…' : 'Save prescription'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's schedule */}
      <section>
        <Eyebrow className="mb-6">TODAY</Eyebrow>
        {loading ? (
          <p className="text-ink-3 text-sm">Loading…</p>
        ) : schedule.length === 0 ? (
          <p className="text-ink-3 text-sm">No active medications scheduled yet.</p>
        ) : (
          <div className="space-y-10">
            {schedule.map((p) => (
              <div key={p.period} className="border-l border-rule pl-6">
                <h3 className="font-serif text-xl text-ink mb-4">{p.period}</h3>
                <ul>
                  {p.meds.map(({ medication, time }) => {
                    const done = isTakenToday(medication);
                    const k = `${medication.id}-${time || 'dose'}`;
                    const saving = savingDoseKey === k;
                    return (
                      <li key={k} className="border-t border-rule first:border-t-0">
                        <button
                          type="button"
                          onClick={() => handleMarkTaken(medication, time)}
                          disabled={done || saving}
                          className={cn(
                            'w-full grid grid-cols-[80px_1fr_auto_24px] gap-4 items-center py-4 text-left transition-opacity',
                            done && 'opacity-40',
                          )}
                        >
                          <span className="font-mono text-sm text-ink-3 tabular-nums">{formatTime(time)}</span>
                          <span className={cn('font-serif text-lg text-ink', done && 'line-through')}>{medication.name}</span>
                          <span className="text-ink-3 text-xs">{medication.dosage} {saving && '· saving…'}</span>
                          <span className={cn(
                            'w-4 h-4 border flex items-center justify-center transition-colors',
                            done ? 'bg-accent border-accent' : 'border-ink-3',
                          )}>
                            {done && <Check size={10} strokeWidth={2.5} className="text-paper" />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <Hairline />

      {/* Active prescriptions */}
      <section>
        <Eyebrow className="mb-6">ACTIVE PRESCRIPTIONS · {medications.length}</Eyebrow>
        {medications.length === 0 ? (
          <p className="text-ink-3 text-sm">None added yet.</p>
        ) : (
          <ul>
            {medications.map((rx) => (
              <li key={rx.id} className="border-t border-rule first:border-t-0 py-5">
                <div className="grid grid-cols-[1fr_auto] gap-6 items-baseline">
                  <div>
                    <h4 className="font-serif text-lg text-ink">{rx.name}</h4>
                    <p className="text-ink-3 text-sm mt-1">{rx.description || rx.instructions || 'No notes saved.'}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono tabular-nums text-sm text-ink">{rx.dosage || '—'}</div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 mt-1">
                      {isTakenToday(rx) ? 'taken · today' : rx.frequency || ''}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
