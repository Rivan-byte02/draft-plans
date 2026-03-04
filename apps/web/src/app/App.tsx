import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { DraftPlanDetailsPage } from '@/features/draft-plans/DraftPlanDetailsPage';
import { DraftPlansPage } from '@/features/draft-plans/DraftPlansPage';

export function App() {
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
