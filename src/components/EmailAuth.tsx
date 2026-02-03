import { useState } from 'react';
import CodeAuthFlow from './EmailAuth/CodeAuthFlow';
import PasswordAuthFlow from './EmailAuth/PasswordAuthFlow';
import ForgotPasswordFlow from './EmailAuth/ForgotPasswordFlow';

const AUTH_URL = 'https://functions.poehali.dev/1a7a39de-f267-44a5-aaf6-04b5c3610d87';

interface EmailAuthProps {
  onSuccess: (email: string) => void;
}

export default function EmailAuth({ onSuccess }: EmailAuthProps) {
  const [authMode, setAuthMode] = useState<'code' | 'password' | 'forgot'>('code');

  if (authMode === 'forgot') {
    return (
      <ForgotPasswordFlow
        authUrl={AUTH_URL}
        onSuccess={onSuccess}
        onBack={() => setAuthMode('password')}
      />
    );
  }

  if (authMode === 'password') {
    return (
      <PasswordAuthFlow
        authUrl={AUTH_URL}
        onSuccess={onSuccess}
        onSwitchToCode={() => setAuthMode('code')}
        onForgotPassword={() => setAuthMode('forgot')}
      />
    );
  }

  return (
    <CodeAuthFlow
      authUrl={AUTH_URL}
      onSuccess={onSuccess}
      onSwitchToPassword={() => setAuthMode('password')}
    />
  );
}
