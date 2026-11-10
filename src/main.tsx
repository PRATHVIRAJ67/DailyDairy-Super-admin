import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, lazy, Suspense, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import Layout from './components/Layout';
import { Button, Spinner, ToastProvider } from './components/ui';
import { ApiError } from './lib/api';
import { useMe, type Me } from './lib/queries';
import { session } from './lib/session';
import Login from './pages/Login';
import './index.css';

const Overview = lazy(() => import('./pages/Overview'));
const Dairies = lazy(() => import('./pages/Dairies'));
const DairyDetail = lazy(() => import('./pages/DairyDetail'));
const Leads = lazy(() => import('./pages/Leads'));
const Audit = lazy(() => import('./pages/Audit'));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2,
      refetchOnWindowFocus: true,
    },
  },
});

const page = (el: ReactNode) => <Suspense fallback={<Spinner />}>{el}</Suspense>;

function Routes({ me }: { me: Me }) {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: <Layout me={me} />,
          children: [
            { index: true, element: page(<Overview />) },
            { path: 'dairies', element: page(<Dairies />) },
            { path: 'dairies/:id', element: page(<DairyDetail />) },
            { path: 'leads', element: page(<Leads />) },
            { path: 'audit', element: page(<Audit />) },
            { path: '*', element: <Navigate to="/" replace /> },
          ],
        },
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me.id],
  );
  return <RouterProvider router={router} />;
}

export function App() {
  const s = useSyncExternalStore(session.subscribe, session.get, () => null);
  const me = useMe(!!s);
  // Signing out (or an expired session) must never leave platform data in memory.
  useEffect(() => {
    if (!s) queryClient.clear();
  }, [s]);
  if (!s) return <Login />;
  if (me.isLoading) return <Spinner label="Signing in" />;
  if (me.isError || !me.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p>We could not load your account.</p>
        <Button onClick={() => session.clear()}>Sign in again</Button>
      </div>
    );
  }
  // The API refuses every platform call for anyone else; this screen just says so plainly.
  if (me.data.role !== 'super_admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-2xl">No platform access</p>
        <p className="max-w-md text-gray-600">
          {me.data.phone} is not a DailyDairy platform admin. Dairy owners and suppliers use the partner dashboard.
        </p>
        <Button onClick={() => { session.clear(); queryClient.clear(); }}>Use a different number</Button>
      </div>
    );
  }
  return <Routes me={me.data} />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
}
