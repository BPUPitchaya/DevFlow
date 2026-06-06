'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  Activity, 
  BarChart3, 
  Users, 
  LogOut,
  Bell,
  UserPlus,
  MessageSquare,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export default function DashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const darkMode = useAuthStore((state) => state.darkMode);
  const toggleDarkMode = useAuthStore((state) => state.toggleDarkMode);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { id: 'feed', label: 'Activity Feed', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'connections', label: 'Connections', icon: UserPlus },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className={cn("min-h-screen", darkMode ? "bg-gray-900" : "bg-gray-50")}>
      <nav className={cn("border-b", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-gray-900")}>DevFlow</h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/dashboard/${item.id}`)}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition',
                      activeTab === item.id
                        ? darkMode
                          ? 'border-white text-white'
                          : 'border-gray-900 text-gray-900'
                        : darkMode
                          ? 'border-transparent text-gray-300 hover:border-gray-500 hover:text-gray-200'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={cn("p-2", darkMode ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-gray-500")}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className={cn("p-2", darkMode ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-gray-500")}>
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>{user?.name}</p>
                  <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>{user?.role?.toLowerCase()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn("p-2", darkMode ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-gray-500")}
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
