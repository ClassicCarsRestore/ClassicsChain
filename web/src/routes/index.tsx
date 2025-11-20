import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ConceptsPage } from './pages/ConceptsPage.tsx';
import { EntitiesPage } from './pages/EntitiesPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehicleCreatePage } from './pages/VehicleCreatePage';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { InvitationPage } from './pages/InvitationPage';
import { SettingsPage } from './pages/SettingsPage';
import { SharedVehiclePage } from './pages/SharedVehiclePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorPage } from './pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/registration',
    element: <RegistrationPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/recovery',
    element: <RecoveryPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/invitation',
    element: <InvitationPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/shared/:token',
    element: <SharedVehiclePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'concepts',
        element: <ConceptsPage />,
      },
      {
        path: 'entities',
        element: <EntitiesPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'vehicles/new',
        element: (
          <ProtectedRoute>
            <VehicleCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'vehicles/:vehicleId',
        element: (
          <ProtectedRoute>
            <VehicleDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
