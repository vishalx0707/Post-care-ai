'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { getAuthErrorMessage, getAuthSuccessState } from './auth-flow';
import { Wordmark } from '@/components/synex/Wordmark';
import { Eyebrow } from '@/components/synex/Eyebrow';
import { Hairline } from '@/components/synex/Hairline';
import { Footnote, Footnotes } from '@/components/synex/Footnote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

async function requestProfile(token, options = {}) {
  const response = await fetch('/api/profile', {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not update your profile');
  return data;
}

export default function LoginPage() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const navigateTo = (path) => {
    router.replace(path);
    router.refresh();
  };

  const finishAuthenticatedLogin = async (user, profileBody = {}) => {
    const token = await user.getIdToken();
    await requestProfile(token, {
      method: 'POST',
      body: JSON.stringify({ email: user.email || email, ...profileBody }),
    });
    const profile = await requestProfile(token);
    const nextState = getAuthSuccessState({
      mode: 'signin',
      hasSession: true,
      onboardingCompleted: profile.onboarding_completed,
    });
    navigateTo(nextState.redirectTo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName.trim()) {
          await updateProfile(credential.user, { displayName: fullName.trim() });
        }
        const token = await credential.user.getIdToken();
        await requestProfile(token, {
          method: 'POST',
          body: JSON.stringify({ fullName: fullName.trim(), email }),
        });
        await credential.user.reload();
        const nextState = getAuthSuccessState({
          mode,
          hasSession: true,
          onboardingCompleted: false,
        });
        navigateTo(nextState.redirectTo);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await finishAuthenticatedLogin(credential.user, { email });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err.message || err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      await finishAuthenticatedLogin(credential.user, {
        fullName: credential.user.displayName || '',
        email: credential.user.email || '',
      });
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(getAuthErrorMessage(err.message || err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper grid lg:grid-cols-2">
      {/* Left pane */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-paper-2 border-r border-rule relative">
        <Link href="/"><Wordmark size="md" /></Link>
        <div className="max-w-[36ch]">
          <Eyebrow className="mb-4">A DAILY COMPANION</Eyebrow>
          <p className="font-serif text-4xl text-ink leading-tight">
            The friend who <span className="italic">remembers</span> your health.
          </p>
          <p className="mt-6 text-ink-2 leading-relaxed">
            Talk to Synex by voice or text. It looks after the small daily things — your meds, your sleep, your reports — so you can live the bigger ones.
          </p>
        </div>
        <Footnotes>
          <p>Not a substitute for medical advice. For emergencies, contact your doctor.<Footnote>*</Footnote></p>
        </Footnotes>
      </aside>

      {/* Right pane */}
      <section className="flex items-center justify-center px-6 py-16 md:px-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Wordmark size="md" />
          </div>

          <Tabs value={mode} onValueChange={(v) => { setMode(v); setError(''); setNotice(''); }}>
            <TabsList>
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value={mode} forceMount>
              <h1 className="font-serif text-3xl text-ink mb-2 leading-tight">
                {mode === 'signin' ? 'Welcome back.' : 'Begin.'}
              </h1>
              <p className="text-ink-3 mb-10 text-sm">
                {mode === 'signin' ? 'Pick up where you left off.' : 'A few details and you’re in.'}
              </p>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                {loading ? 'Please wait…' : 'Continue with Google'}
              </Button>

              <div className="my-8">
                <Hairline label="OR WITH EMAIL" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); if (notice) setNotice(''); }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                    required
                    minLength={6}
                  />
                </div>

                {notice && (
                  <div className="border border-rule px-4 py-3 text-sm text-ink-2 font-mono uppercase tracking-wide text-[11px]">
                    {notice}
                  </div>
                )}
                {error && (
                  <div className="border border-danger px-4 py-3 text-sm text-danger font-mono uppercase tracking-wide text-[11px]">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
                </Button>
              </form>

              <p className="mt-10 font-mono text-[11px] text-ink-3 leading-relaxed">
                By continuing, you agree that Synex is not a substitute for professional medical advice.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}
