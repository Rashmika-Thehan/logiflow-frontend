import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import Login from '@/pages/auth/Login';
import Home from '@/pages/public/Home';
import NotFound from '@/pages/public/NotFound';
import Placeholder from '@/pages/public/Placeholder';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

const soon = (title: string) => <Placeholder title={title} note="This screen is the next build step." />;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="track" element={soon('Track a parcel')} />
            <Route path="track/:trackingCode" element={soon('Track a parcel')} />
            <Route path="privacy" element={<Placeholder title="Privacy policy" note="{{privacy policy}}" />} />
            <Route path="terms" element={<Placeholder title="Terms" note="{{terms of service}}" />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={soon('Create an organization')} />
            <Route path="join" element={soon('Join an organization')} />
          </Route>

          <Route element={<ProtectedRoute roles={['BUSINESS_ADMIN', 'DISPATCHER', 'SUPER_ADMIN']} />}>
            <Route path="dashboard/*" element={soon('Control tower')} />
          </Route>
          <Route element={<ProtectedRoute roles={['DRIVER']} />}>
            <Route path="driver/*" element={soon('Driver home')} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
