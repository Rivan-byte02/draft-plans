import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { ArrowLeftIcon, ShieldIcon } from './Icons';

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const { session, logout } = useAuth();
  const isDetailsPage = location.pathname.startsWith('/draft-plans/');

  return (
    <div className="app-screen">
      <div className="app-frame">
        <header className="app-header">
          <div className="brand-row">
            <Link className="brand-mark" to="/draft-plans">
              <ShieldIcon />
              <span>Dota 2 Draft Plans</span>
            </Link>
            {isDetailsPage ? (
              <Link to="/draft-plans" className="header-back-link">
                <ArrowLeftIcon />
                <span>All Plans</span>
              </Link>
            ) : null}
            {session ? (
              <div className="header-auth-actions">
                <span className="header-auth-user">{session.user.name}</span>
                <button className="header-logout-button" onClick={logout} type="button">
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
