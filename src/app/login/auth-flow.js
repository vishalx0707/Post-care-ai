export function getAuthSuccessState({
  mode,
  hasSession,
  onboardingCompleted,
}) {
  if (mode === 'signup' && !hasSession) {
    return {
      redirectTo: null,
      notice: 'Check your email to confirm your account before signing in.',
    };
  }

  return {
    redirectTo: onboardingCompleted ? '/dashboard' : '/onboarding',
    notice: '',
  };
}

export function getAuthErrorMessage(message = '') {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('too many') ||
    normalizedMessage.includes('after')
  ) {
    return 'Too many signup emails were requested. Please wait a few minutes, then check your inbox or try signing in.';
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Wrong email or password.';
  }

  if (normalizedMessage.includes('already registered')) {
    return 'This email is already registered. Try signing in instead.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Check your email and confirm your account before signing in.';
  }

  if (normalizedMessage.includes('firebase client config is not configured')) {
    const missingMatch = message.match(/Missing ([^.]+)\./i);
    const missing = missingMatch?.[1] ? ` Missing: ${missingMatch[1]}.` : '';

    return `Login is not configured yet.${missing} Add the Firebase Web App NEXT_PUBLIC_* values to .env.local or your deployment environment, then restart the Next.js server.`;
  }

  if (normalizedMessage.includes('operation-not-allowed')) {
    return 'This sign-in method is not enabled yet. Enable it in Firebase Authentication, then try again.';
  }

  if (normalizedMessage.includes('popup-blocked')) {
    return 'Your browser blocked the Google sign-in popup. Allow popups for this site, then try again.';
  }

  return message;
}
