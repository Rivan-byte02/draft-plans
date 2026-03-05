import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { DraftPlanDetailsPage } from '@/features/draft-plans/DraftPlanDetailsPage';
import { DraftPlansPage } from '@/features/draft-plans/DraftPlansPage';

export function App() {
  const { session } = useAuth();

  if (!session) {
    return <LoginPage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/draft-plans" replace />} />
        <Route path="/draft-plans" element={<DraftPlansPage />} />
        <Route path="/draft-plans/:draftPlanId" element={<DraftPlanDetailsPage />} />
      </Routes>
    </AppShell>
  );
}
