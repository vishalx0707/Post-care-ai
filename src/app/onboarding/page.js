'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { Wordmark } from '@/components/synex/Wordmark';
import { StepIndicator } from '@/components/synex/StepIndicator';
import { MotionStep } from '@/components/synex/MotionStep';
import { Hairline } from '@/components/synex/Hairline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SwitchToggle } from '@/components/ui/toggle';

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const canContinue = () => {
    switch (step) {
      case 1: return displayName.trim().length > 0;
      case 2: return true;
      case 3: return age.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleContinue = async () => {
    if (!canContinue() || !user) return;
    setError('');

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const profileData = {
        displayName: displayName.trim(),
        aiCompanionName: aiCompanionName.trim() || 'AI Companion',
        age: parseInt(age, 10) || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        onboarding_completed: true,
      };
      if (dateOfBirth) profileData.dateOfBirth = dateOfBirth;
      if (height) profileData.height = height.trim();
      if (weight) profileData.weight = weight.trim();
      if (sleepTime) profileData.sleepTime = sleepTime;
      if (medicineRoutines.trim()) profileData.medicineRoutines = medicineRoutines.split(',').map((i) => i.trim()).filter(Boolean);
      if (fitnessRoutines.trim()) profileData.fitnessRoutines = fitnessRoutines.split(',').map((i) => i.trim()).filter(Boolean);
      if (healthGoals.trim()) profileData.healthGoals = healthGoals.split(',').map((g) => g.trim()).filter(Boolean);

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save profile');
      }

      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationsEnabled }),
      });

      document.cookie = 'onboarding_done=true; path=/; max-age=31536000; Secure; SameSite=Lax';
      await refreshProfile();
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canContinue()) handleContinue();
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-ink-3 font-mono text-[11px] uppercase tracking-[0.18em]">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col">
      {/* Top bar */}
      <header className="px-6 md:px-10 py-6 flex items-center justify-between border-b border-rule">
        <Wordmark size="sm" />
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </header>

      {/* Body */}
      <section className="flex-1 flex flex-col px-6 md:px-10 py-16 md:py-24 max-w-[680px] w-full mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <MotionStep key="step-1" className="flex flex-col gap-8">
              <h1 className="font-serif text-4xl md:text-6xl text-ink leading-[1.05] tracking-[-0.02em]">
                What should we call you?
              </h1>
              <p className="text-ink-3 max-w-[40ch]">
                Synex will use this when it greets you and confirms reminders.
              </p>
              <Input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-2xl py-4"
                id="onboarding-name"
              />
            </MotionStep>
          )}

          {step === 2 && (
            <MotionStep key="step-2" className="flex flex-col gap-8">
              <h1 className="font-serif text-4xl md:text-6xl text-ink leading-[1.05] tracking-[-0.02em]">
                Name your companion.
              </h1>
              <p className="text-ink-3 max-w-[40ch]">
                Optional. Leave blank to use the default — “AI Companion”.
              </p>
              <Input
                type="text"
                placeholder="e.g. Sarah"
                value={aiCompanionName}
                onChange={(e) => setAiCompanionName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-2xl py-4"
                id="onboarding-ai-name"
              />
            </MotionStep>
          )}

          {step === 3 && (
            <MotionStep key="step-3" className="flex flex-col gap-8">
              <h1 className="font-serif text-4xl md:text-6xl text-ink leading-[1.05] tracking-[-0.02em]">
                How old are you?
              </h1>
              <p className="text-ink-3 max-w-[40ch]">
                Helps tailor recovery suggestions to your stage of life.
              </p>
              <Input
                type="number"
                placeholder="e.g. 28"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-2xl py-4"
                id="onboarding-age"
              />
            </MotionStep>
          )}

          {step === 4 && (
            <MotionStep key="step-4" className="flex flex-col gap-8">
              <h1 className="font-serif text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
                Anything else?
              </h1>
              <p className="text-ink-3 max-w-[44ch]">
                All of this is optional and editable later in Settings.
              </p>

              <div className="flex flex-col">
                <FieldRow label="Date of birth"><Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></FieldRow>
                <FieldRow label="Height"><Input type="text" placeholder="e.g. 5'10&quot; or 178cm" value={height} onChange={(e) => setHeight(e.target.value)} /></FieldRow>
                <FieldRow label="Weight"><Input type="text" placeholder="e.g. 75kg or 165lbs" value={weight} onChange={(e) => setWeight(e.target.value)} /></FieldRow>
                <FieldRow label="Sleep time"><Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} /></FieldRow>
                <FieldRow label="Medicine routines"><Input type="text" placeholder="e.g. Metformin after dinner" value={medicineRoutines} onChange={(e) => setMedicineRoutines(e.target.value)} /></FieldRow>
                <FieldRow label="Fitness routines"><Input type="text" placeholder="e.g. walk 20 minutes" value={fitnessRoutines} onChange={(e) => setFitnessRoutines(e.target.value)} /></FieldRow>
                <FieldRow label="Health goals"><Input type="text" placeholder="e.g. better sleep, recovery" value={healthGoals} onChange={(e) => setHealthGoals(e.target.value)} /></FieldRow>
                <div className="flex items-center justify-between py-4 border-t border-rule">
                  <div>
                    <Label className="text-ink mb-1">Notification reminders</Label>
                    <p className="text-xs text-ink-3">Gentle nudges for medications and routines.</p>
                  </div>
                  <SwitchToggle pressed={notificationsEnabled} onPressedChange={setNotificationsEnabled} />
                </div>
              </div>
            </MotionStep>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-danger">
            {error}
          </p>
        )}
      </section>

      {/* Bottom nav */}
      <footer className="border-t border-rule px-6 md:px-10 py-6 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="ghost" onClick={handleBack}>← Back</Button>
        ) : (
          <span />
        )}
        <Button onClick={handleContinue} disabled={!canContinue() || loading}>
          {loading ? 'Saving…' : step === TOTAL_STEPS ? 'Get started →' : 'Continue →'}
        </Button>
      </footer>
    </main>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 items-center py-3 border-t border-rule">
      <Label className="text-ink-3">{label}</Label>
      {children}
    </div>
  );
}
