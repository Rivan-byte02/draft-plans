import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { ArrowLeftIcon, ShieldIcon } from './Icons';

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
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
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
