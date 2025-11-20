import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Shield, Settings, ChevronDown, Menu, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { t } = useTranslation('navigation');
  const { isAuthenticated, logout, session, hasAdminAccess } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const userEmail = session?.identity?.traits?.email as string | undefined;

  const handleMainMenuClose = () => {
    setIsMainMenuOpen(false);
  };

  const handleAccountMenuClose = () => {
    setIsAccountMenuOpen(false);
  };

  const handleLogout = () => {
    handleAccountMenuClose();
    logout();
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-foreground">
              {t('title')}
            </Link>
            <Link
              to="/concepts"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('concepts')}
            </Link>
            <Link
              to="/entities"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('entities')}
            </Link>
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('dashboard')}
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden sm:flex items-center gap-4">
            <LanguageSwitcher />
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/registration"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t('register')}
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                >
                  {userEmail && <span>{userEmail}</span>}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card shadow-lg">
                    <div className="p-4 border-b border-border">
                      <p className="text-xs text-muted-foreground">{t('account')}</p>
                      <p className="text-sm font-medium text-foreground">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                      >
                        <Settings className="h-4 w-4" />
                        {t('settings')}
                      </Link>
                      {hasAdminAccess() && (
                        <a
                          href={import.meta.env.VITE_ADMIN_URL as string}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted cursor-pointer"
                        >
                          <Shield className="h-4 w-4" />
                          {t('adminPanel')}
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted border-t border-border"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Navigation - Reddit/Gmail Style */}
          <div className="flex sm:hidden items-center justify-between w-full gap-2">
            {/* Left: Main Menu */}
            <Sheet open={isMainMenuOpen} onOpenChange={setIsMainMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col gap-6 p-6">
                  <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>

                  <Link
                    to="/concepts"
                    onClick={handleMainMenuClose}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
                  >
                    {t('concepts')}
                  </Link>

                  <Link
                    to="/entities"
                    onClick={handleMainMenuClose}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
                  >
                    {t('entities')}
                  </Link>

                  {isAuthenticated && (
                    <Link
                      to="/dashboard"
                      onClick={handleMainMenuClose}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
                    >
                      {t('dashboard')}
                    </Link>
                  )}

                  <div className="border-t border-border pt-6">
                    <LanguageSwitcher />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Center: Brand Logo */}
            <Link to="/" className="text-lg font-bold text-foreground flex-1">
              {t('title')}
            </Link>

            {/* Right: Account Menu */}
            <Sheet open={isAccountMenuOpen} onOpenChange={setIsAccountMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isAuthenticated ? <User className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-6 p-6">
                  {!isAuthenticated ? (
                    <div className="flex flex-col gap-3">
                      <Link
                        to="/login"
                        onClick={handleAccountMenuClose}
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
                      >
                        {t('login')}
                      </Link>
                      <Link
                        to="/registration"
                        onClick={handleAccountMenuClose}
                        className="rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {t('register')}
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="pb-4 border-b border-border">
                        <p className="text-xs text-muted-foreground">{t('account')}</p>
                        <p className="text-sm font-medium text-foreground break-all">{userEmail}</p>
                      </div>

                      <Link
                        to="/settings"
                        onClick={handleAccountMenuClose}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
                      >
                        <Settings className="h-4 w-4" />
                        {t('settings')}
                      </Link>

                      {hasAdminAccess() && (
                        <a
                          href={import.meta.env.VITE_ADMIN_URL as string}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary cursor-pointer"
                        >
                          <Shield className="h-4 w-4" />
                          {t('adminPanel')}
                        </a>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:text-primary text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                      </button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
