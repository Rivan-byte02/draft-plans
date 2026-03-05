import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api/client';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('demo@draftplans.dev');
  const [password, setPassword] = useState('demo12345');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await loginWithCredentials({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page-shell">
      <div className="auth-card">
        <h1>Sign In</h1>
        <p>Use your account to access draft plans that belong to you.</p>

        <form className="auth-form" data-testid="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              data-testid="login-email-input"
              placeholder="you@example.com"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              data-testid="login-password-input"
              minLength={8}
              placeholder="Your password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {errorMessage ? <p className="auth-error-text">{errorMessage}</p> : null}

          <button
            className="primary-button auth-submit-button"
            data-testid="login-submit-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
