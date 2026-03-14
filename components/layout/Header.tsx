import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, FileText, Users } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="text-xl font-semibold">AutiScreen</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {user?.role === 'patient' && (
            <>
              <Link 
                to="/patient/dashboard" 
                className={`nav-link ${isActive('/patient/dashboard') ? 'nav-link-active' : ''}`}
              >
                <LayoutDashboard className="h-4 w-4 inline-block mr-2" />
                Dashboard
              </Link>
              <Link 
                to="/patient/assessment" 
                className={`nav-link ${isActive('/patient/assessment') ? 'nav-link-active' : ''}`}
              >
                <FileText className="h-4 w-4 inline-block mr-2" />
                Assessment
              </Link>
            </>
          )}
          {user?.role === 'therapist' && (
            <>
              <Link 
                to="/therapist/dashboard" 
                className={`nav-link ${isActive('/therapist/dashboard') ? 'nav-link-active' : ''}`}
              >
                <LayoutDashboard className="h-4 w-4 inline-block mr-2" />
                Dashboard
              </Link>
              <Link 
                to="/therapist/patients" 
                className={`nav-link ${isActive('/therapist/patients') ? 'nav-link-active' : ''}`}
              >
                <Users className="h-4 w-4 inline-block mr-2" />
                Patients
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    Role: {user.role}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(user.role === 'patient' ? '/patient/dashboard' : '/therapist/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
