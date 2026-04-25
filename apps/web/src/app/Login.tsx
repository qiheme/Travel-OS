import { useState } from 'react';
import { signInWithMagicLink } from '../lib/db';

type LoginStep = 'form' | 'sent' | 'error';

export function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<LoginStep>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setErrorMessage(error.message);
      setStep('error');
    } else {
      setStep('sent');
    }
  };

  if (step === 'sent') {
    return (
      <div className="login-confirm">
        <h1>Check your email</h1>
        <p>
          We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-mark">T</div>
        <h1>Travel OS</h1>
        <p>Sign in with a magic link — no password needed.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          {step === 'error' && (
            <p role="alert" className="login-error">
              {errorMessage}
            </p>
          )}
          <button type="submit" className="btn primary" disabled={!email.trim()}>
            Send magic link
          </button>
        </form>
      </div>
    </div>
  );
}
