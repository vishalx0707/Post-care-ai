'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Wordmark } from '@/components/synex/Wordmark';
import { Eyebrow } from '@/components/synex/Eyebrow';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-10%' },
  transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
};

const TONES = [
  { key: 'friendly', label: 'Friendly', quote: 'You took your morning meds. That’s three days running — I noticed.' },
  { key: 'calm', label: 'Calm', quote: 'It’s 9:45. Your sleep window opens in fifteen minutes. No rush.' },
  { key: 'funny', label: 'Funny', quote: 'The doctor said “sinus rhythm.” It’s good. Your heart is just being polite.' },
  { key: 'supportive', label: 'Supportive', quote: 'The first week is the hardest. You don’t need to do this perfectly to do it well.' },
];

const FAQS = [
  { q: 'Is this a doctor?', a: 'No. Synex is a daily companion — not a clinician. For anything urgent, call your doctor or emergency services.' },
  { q: 'Will it actually remember me?', a: 'Yes. Mention you sleep at 11, walk after dinner, take Vitamin D in the morning — Synex carries the small things forward, so you don’t have to repeat yourself.' },
  { q: 'What can I share with it?', a: 'Anything about your day — meals, sleep, medications, energy, mood. You can also drop in lab results or discharge summaries; it’ll explain them in plain language.' },
  { q: 'Can I name it?', a: 'Yes. Pick any name during onboarding — Sarah, Theo, Sam. The companion shows up everywhere with the name you chose.' },
  { q: 'Where does my data live?', a: 'Stored in Firebase under your account. Conversation analysis is performed by Google Gemini. We don’t train on your data, and we don’t sell it.' },
  { q: 'Will it nag me?', a: 'No. By default, Synex confirms before adding reminders. You can turn on auto-routines if you want it to be more hands-on.' },
];

function TonePicker() {
  const [active, setActive] = useState(0);
  const t = TONES[active];
  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-12 items-center py-24 border-t border-rule">
      <div>
        <Eyebrow className="mb-6">A COMPANION, IN YOUR VOICE</Eyebrow>
        <motion.p
          key={t.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-serif text-3xl md:text-4xl italic text-ink leading-snug max-w-[28ch]"
        >
          “{t.quote}”
        </motion.p>
        <p className="mt-6 text-ink-3 text-sm">— Synex, in <em className="text-accent not-italic font-medium">{t.label.toLowerCase()}</em> tone.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Eyebrow>Pick a feel</Eyebrow>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone, i) => (
            <button
              key={tone.key}
              onClick={() => setActive(i)}
              className={`font-mono text-[11px] uppercase tracking-[0.18em] px-3 py-2 border rounded-full transition-colors ${
                i === active
                  ? 'border-accent bg-accent text-paper'
                  : 'border-rule-strong text-ink-3 hover:border-ink hover:text-ink'
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Conversation({ lines }) {
  return (
    <div className="warm-card space-y-5 max-w-md">
      {lines.map((l, i) => (
        <div key={i}>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3 mb-1.5">
            {l.who}
          </div>
          {l.companion ? (
            <p className="font-serif text-lg italic text-ink border-l-2 border-accent pl-3 leading-snug">
              {l.text}
            </p>
          ) : (
            <p className="text-ink text-base leading-snug">{l.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-rule">
        <div className="max-w-[1200px] mx-auto h-16 px-6 md:px-10 flex items-center justify-between">
          <Link href="/"><Wordmark size="sm" /></Link>
          <nav className="flex items-center gap-6">
            <Link href="#how" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 hover:text-ink transition-colors">How it works</Link>
            <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:text-accent transition-colors">Sign in →</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 md:px-10">
        {/* Hero */}
        <section className="py-24 md:py-36 grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-9">
            <div className="flex items-center gap-3 mb-8">
              <span className="pulse-dot" />
              <Eyebrow>A DAILY COMPANION</Eyebrow>
            </div>
            <h1 className="font-serif text-[64px] md:text-[120px] leading-[0.92] tracking-[-0.035em] text-ink">
              The friend
              <br />
              who remembers
              <br />
              <span className="italic">your <span className="scribble">health</span>.</span>
            </h1>
          </div>
          <div className="md:col-span-3 md:pb-4">
            <p className="text-ink-2 text-lg leading-relaxed max-w-[28ch] mb-8">
              Synex isn’t a tracker. It’s a companion you talk to — by voice or by text — that quietly looks after the small daily things so you can live the bigger ones.
            </p>
            <div className="flex items-center gap-6">
              <Button asChild size="lg" id="get-started-btn">
                <Link href="/login">Begin →</Link>
              </Button>
              <Link href="#how" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:text-accent transition-colors">
                How it works
              </Link>
            </div>
          </div>
        </section>

        {/* Companion intro — letter style */}
        <motion.section {...fadeIn} className="py-24 border-t border-rule grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <Eyebrow>FROM YOUR COMPANION</Eyebrow>
            <p className="mt-3 text-ink-3 text-sm">
              You name it. You shape its tone. It remembers what you tell it — without you having to repeat yourself.
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="font-serif text-2xl md:text-3xl italic text-ink leading-relaxed">
              “Hi. I’ll be here every day — checking in on your sleep, your meds, the small routines that hold the week together. You can call me whatever you’d like. I’ll learn how you talk, and I won’t pretend to be your doctor.”
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">— your companion, day one</p>
          </div>
        </motion.section>

        {/* Four moments */}
        <motion.section {...fadeIn} id="features" className="py-24 border-t border-rule">
          <Eyebrow className="mb-12">FOUR MOMENTS, EVERY DAY</Eyebrow>
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">01 — MORNING</span>
              <h3 className="font-serif text-3xl md:text-4xl mt-3 leading-tight">A check-in, not a checklist.</h3>
              <p className="text-ink-2 mt-4 max-w-[42ch] leading-relaxed">
                Synex greets you by name, asks how you slept, and quietly lines up what your day looks like. No streaks, no badges.
              </p>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <Conversation lines={[
                { who: 'SARAH', companion: true, text: 'Morning, Vishal. You slept seven hours — best in a week. Want me to hold breakfast meds till 9?' },
                { who: 'VISHAL', text: 'Yeah, push them to 9.' },
              ]} />
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-12 mt-24">
            <div className="md:col-span-6">
              <Conversation lines={[
                { who: 'YOU', text: 'I should probably take Vitamin D every morning around 9.' },
                { who: 'SARAH', companion: true, text: 'Noted. Want me to add that to your routine, or just remind you tomorrow?' },
              ]} />
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">02 — DURING</span>
              <h3 className="font-serif text-3xl md:text-4xl mt-3 leading-tight">It listens for habits.</h3>
              <p className="text-ink-2 mt-4 max-w-[42ch] leading-relaxed">
                Mention something in passing — a routine, a snack, a walk. Synex offers to make it real, but waits for your nod.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-12 mt-24">
            <div className="md:col-span-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">03 — REPORTS</span>
              <h3 className="font-serif text-3xl md:text-4xl mt-3 leading-tight">Translates the jargon.</h3>
              <p className="text-ink-2 mt-4 max-w-[42ch] leading-relaxed">
                Drop in a lab panel or discharge summary. You get back the findings in plain language — what’s normal, what to ask about.
              </p>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <div className="warm-card space-y-4">
                <div>
                  <Eyebrow>SUMMARY</Eyebrow>
                  <p className="mt-2 font-serif text-lg leading-snug">
                    Your blood pressure is sitting in a healthy range. Cholesterol is slightly elevated — worth raising at your next visit.
                  </p>
                </div>
                <div className="border-t border-rule pt-4 space-y-2.5 text-sm text-ink-2">
                  <div className="flex gap-3"><span className="w-2 h-2 rounded-full bg-leaf mt-1.5 shrink-0" /><span><strong>Sinus rhythm</strong> — heart rhythm is normal.</span></div>
                  <div className="flex gap-3"><span className="w-2 h-2 rounded-full bg-warn mt-1.5 shrink-0" /><span><strong>LDL 142 mg/dL</strong> — moderately above target.</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-12 mt-24">
            <div className="md:col-span-6">
              <Conversation lines={[
                { who: 'SARAH', companion: true, text: 'You skipped your evening walk last night. No worries — want me to nudge you tonight at 7:15?' },
                { who: 'YOU', text: 'Yes, but be gentle about it.' },
                { who: 'SARAH', companion: true, text: 'Always.' },
              ]} />
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">04 — EVENING</span>
              <h3 className="font-serif text-3xl md:text-4xl mt-3 leading-tight">A bond, not a buzzer.</h3>
              <p className="text-ink-2 mt-4 max-w-[42ch] leading-relaxed">
                Synex shows up the way a thoughtful friend would — checking in on your sleep, your day, the things that matter. Without making you feel watched.
              </p>
            </div>
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section {...fadeIn} id="how" className="py-32 border-t border-rule">
          <Eyebrow className="mb-10">HOW IT WORKS</Eyebrow>
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              { n: '01', t: 'Tell it your name.', d: 'A 30-second onboarding asks what to call you, what to call your companion, and your age. Health details are optional, always.' },
              { n: '02', t: 'Talk to it.', d: 'By voice or by text. Mention what you ate, when you slept, how you feel. Synex remembers — and uses it next time.' },
              { n: '03', t: 'Live with it.', d: 'It checks in when it should, and stays out of your way when it shouldn’t. The bond builds slowly, like with a real friend.' },
            ].map((s, i) => (
              <div key={s.n} className={i > 0 ? 'md:border-l md:border-rule md:pl-12' : ''}>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">{s.n}</span>
                <h3 className="font-serif text-2xl mt-3 mb-3 leading-tight">{s.t}</h3>
                <p className="text-ink-2 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <TonePicker />

        {/* Privacy */}
        <motion.section {...fadeIn} className="py-24 border-t border-rule grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <Eyebrow>WHERE YOUR DATA LIVES</Eyebrow>
          </div>
          <div className="md:col-span-7 md:col-start-6 space-y-5 text-ink-2 leading-relaxed">
            <p>
              Your profile, conversations, schedules and reports are stored in <strong className="text-ink">Firebase</strong>, scoped to your account. They never appear in shared training data.
            </p>
            <p>
              Conversation and report analysis is generated by <strong className="text-ink">Google Gemini</strong>, called per-request. We don’t train on your data and we don’t sell it.
            </p>
            <p className="font-serif italic text-ink">
              Synex is not a substitute for clinical advice. For anything urgent, contact your doctor or emergency services.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section {...fadeIn} className="py-24 border-t border-rule">
          <div className="grid md:grid-cols-12 gap-8 mb-12">
            <div className="md:col-span-4">
              <Eyebrow>QUESTIONS</Eyebrow>
            </div>
            <h2 className="md:col-span-7 md:col-start-6 font-serif text-4xl md:text-5xl leading-tight max-w-[20ch]">
              Things people ask <span className="italic">first</span>.
            </h2>
          </div>
          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-7 md:col-start-6">
              <Accordion type="single" collapsible>
                {FAQS.map((f, i) => (
                  <AccordionItem key={i} value={`f-${i}`}>
                    <AccordionTrigger>{f.q}</AccordionTrigger>
                    <AccordionContent>{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </motion.section>

        {/* Closing CTA */}
        <motion.section {...fadeIn} className="py-32 border-t border-rule text-center">
          <p className="font-serif italic text-2xl md:text-3xl text-ink-3 mb-6">a quiet companion, every day</p>
          <h2 className="font-serif text-5xl md:text-7xl text-ink leading-[0.95] tracking-[-0.03em] mb-12 max-w-[16ch] mx-auto">
            Begin <span className="italic scribble">together</span>.
          </h2>
          <Button asChild size="lg">
            <Link href="/login">Meet your companion →</Link>
          </Button>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-rule mt-16">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-12 grid md:grid-cols-3 gap-12">
          <div>
            <Wordmark size="md" />
            <p className="text-sm text-ink-3 mt-4 max-w-[28ch] leading-relaxed font-serif italic">
              The friend who remembers your health.
            </p>
          </div>
          <div className="space-y-3">
            <Eyebrow>Product</Eyebrow>
            <ul className="space-y-2 text-sm text-ink-2">
              <li><Link href="/login" className="hover:text-accent">Sign in</Link></li>
              <li><Link href="#how" className="hover:text-accent">How it works</Link></li>
              <li><Link href="#features" className="hover:text-accent">Daily moments</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <Eyebrow>Notice</Eyebrow>
            <p className="font-mono text-[11px] text-ink-3 leading-relaxed">
              Synex is informational software. It does not diagnose, treat, or replace a clinician. For emergencies, contact emergency services.
            </p>
          </div>
        </div>
        <div className="border-t border-rule">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-6 flex justify-between items-center">
            <span className="font-mono text-[11px] text-ink-3">© {new Date().getFullYear()} Synex.</span>
            <span className="font-mono text-[11px] text-ink-3 italic font-serif">— made for daily life.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
