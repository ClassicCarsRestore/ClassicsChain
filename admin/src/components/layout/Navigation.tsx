import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export function Navigation() {
  const { t } = useTranslation('navigation');
  const { session, logout, isGlobalAdmin, getUserEntities } = useAuth();

  const userEmail = session?.identity?.traits?.email as string | undefined;
  const userEntities = getUserEntities();

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-foreground">
              {t('title')}
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('home')}
              </Link>

              {/* Admin Users - only for global admins */}
              {isGlobalAdmin() && (
                <Link
                  to="/users"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('users')}
                </Link>
              )}

              {/* Entities - only for global admins */}
              {isGlobalAdmin() && (
                <Link
                  to="/entities"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('entities')}
                </Link>
              )}

              {/* Vehicles - for global admins and entity members */}
              {(isGlobalAdmin() || userEntities.length > 0) && (
                <Link
                  to="/vehicles"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('vehicles')}
                </Link>
              )}

              {/* Bulk Certificates - for global admins and entity members */}
              {(isGlobalAdmin() || userEntities.length > 0) && (
                <Link
                  to="/bulk-certificates"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('eventCertificates')}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {userEmail && (
              <span className="text-sm text-muted-foreground">{userEmail}</span>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
