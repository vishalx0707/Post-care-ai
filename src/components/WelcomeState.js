'use client';

import { useAuth } from '@/components/AuthProvider';
import './WelcomeState.css';

const PROMPTS = [
  'What does my blood test report mean?',
  'Explain my discharge summary',
  'What precautions should I take after surgery?',
  'Help me build a recovery routine',
];

export default function WelcomeState({ onPromptClick }) {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="welcome">
      <h2 className="welcome__title">Hello, {name}</h2>
      <p className="welcome__subtitle">
        Upload a medical report or ask a health question to get started.
      </p>
      <div className="welcome__prompts">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="welcome__prompt"
            onClick={() => onPromptClick(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
