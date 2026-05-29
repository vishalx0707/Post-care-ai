# Synex

Synex is a personal health companion built with Next.js, Firebase, and Google Gemini. It gives users a daily health dashboard, an AI companion that remembers context across conversations, medication routines, report analysis, onboarding, and profile settings in one product surface.

Synex is informational software. It does not diagnose, treat, or replace a clinician. For urgent health concerns, contact a doctor or emergency services.

## Features

- AI companion chat with streamed Gemini responses
- Voice-first companion mode through browser speech APIs
- Saved chat history and user health memories
- Medication schedule creation, tracking, and daily completion state
- AI-assisted schedule detection from natural language requests
- Medical report upload or paste-in with plain-English summaries
- Firebase Auth sign-in with email/password and Google
- Onboarding for profile, companion name, health context, routines, and reminders
- Settings for tone, voice, notifications, and schedule behavior
- Firebase-backed dashboard with user-scoped data

## Tech Stack

- Next.js 16 and React 19
- Firebase Auth, Firestore, Storage, and Admin SDK
- Google Gemini via `@google/generative-ai`
- Tailwind CSS v4 and shadcn-style JSX primitives
- Framer Motion
- lucide-react icons
- pdf-parse for report text extraction

## Project Structure

```text
src/
  app/
    api/                 Server routes for auth-backed app data and AI flows
    dashboard/           Authenticated dashboard, companion, meds, reports, settings
    login/               Email and Google auth
    onboarding/          First-run profile setup
  components/
    synex/               Product-specific UI primitives
    ui/                  Shared UI controls
  lib/
    firebase/            Firebase client, admin, and auth helpers
    health/              Memory, chat history, and schedule intent helpers
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the required Firebase and Gemini values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
FIREBASE_SERVICE_ACCOUNT_JSON=

GEMINI_API_KEY=
GEMINI_MODEL=
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Firebase Setup

Enable these Firebase services for the project:

- Authentication with email/password and Google providers
- Firestore Database
- Cloud Storage

Deploy security rules when needed:

```bash
firebase deploy --only firestore:rules,storage
```

## Scripts

```bash
npm run dev      # Start the local Next.js dev server
npm run build    # Build the production app
npm run start    # Start the production server
npm run lint     # Run linting
```

## Notes

- Gemini and report analysis require `GEMINI_API_KEY`.
- Firebase Admin API routes require valid server credentials.
- Report uploads support PDF, image, and text inputs up to the app limit.
- Browser voice mode depends on Web Speech API support.
- Notification settings are stored, but browser push scheduling is not implemented yet.
