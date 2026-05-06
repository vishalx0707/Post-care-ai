'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Eyebrow } from '@/components/synex/Eyebrow';
import { Hairline } from '@/components/synex/Hairline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SwitchToggle } from '@/components/ui/toggle';

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'calm', label: 'Calm' },
  { value: 'funny', label: 'Funny' },
  { value: 'supportive', label: 'Supportive' },
];

export default function SettingsPage() {
  const { user, profile, authFetch, refreshProfile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [aiCompanionName, setAiCompanionName] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [medicineRoutines, setMedicineRoutines] = useState('');
  const [fitnessRoutines, setFitnessRoutines] = useState('');
  const [healthGoals, setHealthGoals] = useState('');

  const [tone, setTone] = useState('friendly');
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [askBefore, setAskBefore] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAiCompanionName(profile.aiCompanionName || '');
      setAge(profile.age?.toString() || '');
      setDateOfBirth(profile.dateOfBirth || '');
      setHeight(profile.height || '');
      setWeight(profile.weight || '');
      setSleepTime(profile.sleepTime || '');
      setMedicineRoutines(profile.medicineRoutines?.join(', ') || '');
      setFitnessRoutines(profile.fitnessRoutines?.join(', ') || '');
      setHealthGoals(profile.healthGoals?.join(', ') || '');
    }
  }, [profile]);

  useEffect(() => {
    async function load() {
      const data = await authFetch('/api/settings');
      if (data) {
        setTone(data.tone || 'friendly');
        setAutoSchedule(data.autoScheduleEnabled || false);
        setAskBefore(data.askBeforeCreatingReminder !== false);
        setVoiceEnabled(data.voiceEnabled !== false);
        setNotifications(data.notificationsEnabled !== false);
      }
    }
    if (user) load();
  }, [user, authFetch]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    const profileData = {
      displayName: displayName.trim(),
      aiCompanionName: aiCompanionName.trim() || 'AI Companion',
      age: parseInt(age, 10) || null,
    };
    if (dateOfBirth) profileData.dateOfBirth = dateOfBirth;
    if (height.trim()) profileData.height = height.trim();
    if (weight.trim()) profileData.weight = weight.trim();
    if (sleepTime) profileData.sleepTime = sleepTime;
    if (medicineRoutines.trim()) profileData.medicineRoutines = medicineRoutines.split(',').map((i) => i.trim()).filter(Boolean);
    if (fitnessRoutines.trim()) profileData.fitnessRoutines = fitnessRoutines.split(',').map((i) => i.trim()).filter(Boolean);
    if (healthGoals.trim()) profileData.healthGoals = healthGoals.split(',').map((g) => g.trim()).filter(Boolean);

    const token = await user.getIdToken();
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileData),
    });
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tone, autoScheduleEnabled: autoSchedule, askBeforeCreatingReminder: askBefore,
        voiceEnabled, notificationsEnabled: notifications,
      }),
    });
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col gap-12">
      <header>
        <Eyebrow className="mb-3">SETTINGS</Eyebrow>
        <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight tracking-[-0.02em]">Your details.</h1>
      </header>

      {/* Profile */}
      <section>
        <Eyebrow className="mb-6">PROFILE</Eyebrow>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <Field label="Your name"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="What should the AI call you?" /></Field>
          <Field label="Email"><Input type="email" value={profile?.email || user?.email || ''} disabled className="text-ink-3" /></Field>
          <Field label="Age"><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} min="1" max="120" /></Field>
          <Field label="Date of birth"><Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></Field>
          <Field label="Height"><Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 178cm" /></Field>
          <Field label="Weight"><Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 75kg" /></Field>
          <Field label="Sleep time"><Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} /></Field>
          <div />
          <div className="md:col-span-2"><Field label="Medicine routines"><Input value={medicineRoutines} onChange={(e) => setMedicineRoutines(e.target.value)} placeholder="comma-separated" /></Field></div>
          <div className="md:col-span-2"><Field label="Fitness routines"><Input value={fitnessRoutines} onChange={(e) => setFitnessRoutines(e.target.value)} placeholder="comma-separated" /></Field></div>
          <div className="md:col-span-2"><Field label="Health goals"><Input value={healthGoals} onChange={(e) => setHealthGoals(e.target.value)} placeholder="comma-separated" /></Field></div>
        </div>
      </section>

      <Hairline />

      {/* Customize AI */}
      <section>
        <Eyebrow className="mb-6">CUSTOMIZE AI</Eyebrow>

        <div className="space-y-8">
          <Field label="Companion name">
            <Input value={aiCompanionName} onChange={(e) => setAiCompanionName(e.target.value)} placeholder="Default: AI Companion" />
          </Field>

          <div className="space-y-3">
            <Label>Tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  data-state={tone === opt.value ? 'on' : 'off'}
                  onClick={() => setTone(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <ul className="space-y-1">
            <ToggleRow label="Auto-create schedules" hint="AI creates schedules automatically when detected." pressed={autoSchedule} onChange={setAutoSchedule} />
            <ToggleRow label="Ask before creating" hint="Confirm before adding reminders." pressed={askBefore} onChange={setAskBefore} />
            <ToggleRow label="Voice enabled" hint="Enable voice input and output." pressed={voiceEnabled} onChange={setVoiceEnabled} />
            <ToggleRow label="Notifications" hint="Receive medication and health reminders." pressed={notifications} onChange={setNotifications} />
          </ul>
        </div>
      </section>

      <Hairline />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
              <Check size={12} strokeWidth={2} /> Saved
            </span>
          )}
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="text-danger">Sign out</Button>
      </div>
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

function ToggleRow({ label, hint, pressed, onChange }) {
  return (
    <li className="flex items-center justify-between py-4 border-t border-rule">
      <div>
        <div className="font-serif text-base text-ink">{label}</div>
        <div className="text-ink-3 text-sm mt-0.5">{hint}</div>
      </div>
      <SwitchToggle pressed={pressed} onPressedChange={onChange} />
    </li>
  );
}
