import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { HomePage } from './pages/HomePage';
import { UsersPage } from './pages/UsersPage';
import { EntitiesPage } from './pages/EntitiesPage';
import { EntityDetailPage } from './pages/EntityDetailPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { BulkCertificatesPage } from './pages/BulkCertificatesPage';
import { InvitationClaimPage } from './pages/InvitationClaimPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorPage } from './pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/invite/:token',
    element: <InvitationClaimPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'users',
        element: (
          <RoleProtectedRoute requireGlobalAdmin>
            <UsersPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'entities',
        element: (
          <RoleProtectedRoute requireGlobalAdmin>
            <EntitiesPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'entities/:entityId',
        element: (
          <RoleProtectedRoute requireEntityAccess>
            <EntityDetailPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'vehicles',
        element: (
          <RoleProtectedRoute requireEntityAccess>
            <VehiclesPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'bulk-certificates',
        element: (
          <RoleProtectedRoute requireEntityAccess>
            <BulkCertificatesPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
