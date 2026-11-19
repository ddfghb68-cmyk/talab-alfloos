import { History, Inbox, LogOut, PlusCircle } from 'lucide-react';
import type { AppPage } from '../lib/types';

interface AppHeaderProps {
  activePage: AppPage;
  ordersCount: number;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}

export function AppHeader({
  activePage,
  ordersCount,
  onNavigate,
  onLogout,
}: AppHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onNavigate('order')}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 rounded cursor-pointer"
          >
            طلب الفلوس
          </button>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-6"
          >
            <button
              type="button"
              onClick={() => onNavigate('order')}
              aria-current={activePage === 'order' ? 'page' : undefined}
              className={`min-h-[40px] px-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'order'
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              الصفحة الرئيسية
            </button>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              aria-current={activePage === 'history' ? 'page' : undefined}
              className={`min-h-[40px] px-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'history'
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              طلباتي السابقة ({ordersCount})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              aria-current={activePage === 'admin' ? 'page' : undefined}
              className={`min-h-[40px] px-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                activePage === 'admin'
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              الطلبات الواردة
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="التنقل السريع"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3"
      >
        <button
          type="button"
          onClick={() => onNavigate('order')}
          aria-current={activePage === 'order' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium whitespace-nowrap transition-colors ${
            activePage === 'order'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-5 h-5" aria-hidden="true" />
          <span>طلب جديد</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('history')}
          aria-current={activePage === 'history' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium whitespace-nowrap transition-colors ${
            activePage === 'history'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-5 h-5" aria-hidden="true" />
          <span>طلباتي ({ordersCount})</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('admin')}
          aria-current={activePage === 'admin' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium whitespace-nowrap transition-colors ${
            activePage === 'admin'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-5 h-5" aria-hidden="true" />
          <span>الواردة</span>
        </button>
      </nav>
    </>
  );
}
