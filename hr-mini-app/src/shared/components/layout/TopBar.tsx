import { useUIStore } from '@shared/stores/uiStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { Button } from '@shared/components/ui/Button';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const theme = useUIStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4"
      role="banner"
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden md:flex h-9 w-9 p-0"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        {title && (
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h1>
        )}
      </div>

      {/* Right: theme toggle + user */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
          className="h-9 w-9 p-0"
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </Button>

        {user && (
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-[var(--color-text-primary)]">
              {user.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
