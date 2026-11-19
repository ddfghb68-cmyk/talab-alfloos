import { useEffect, useState } from 'react';
import { AdminInbox } from './components/AdminInbox';
import { AppHeader } from './components/AppHeader';
import { LoginScreen } from './components/LoginScreen';
import { OrderDashboard } from './components/OrderDashboard';
import { OrdersHistory } from './components/OrdersHistory';
import { createOrderApi, fetchUserOrdersApi } from './lib/api';
import {
  clearUserSession,
  loadOrdersForUser,
  loadUserSession,
  saveOrdersForUser,
  saveUserSession,
} from './lib/storage';
import type {
  AppPage,
  FollowerOrder,
  ServiceType,
  UserProfile,
} from './lib/types';

function getInitialSession(): {
  user: UserProfile | null;
  orders: FollowerOrder[];
} {
  if (typeof window === 'undefined') {
    return { user: null, orders: [] };
  }

  const storedUser = loadUserSession();
  if (storedUser) {
    return {
      user: storedUser,
      orders: loadOrdersForUser(storedUser.normalizedPhone),
    };
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    const demoUser: UserProfile = {
      fullName: 'يوسف المنصوري',
      phone: '0612345678',
      normalizedPhone: '0612345678',
      loggedInAt: new Date().toISOString(),
    };
    saveUserSession(demoUser);
    return {
      user: demoUser,
      orders: loadOrdersForUser(demoUser.normalizedPhone),
    };
  }

  return { user: null, orders: [] };
}

function getInitialPage(): AppPage {
  if (typeof window !== 'undefined') {
    if (window.location.hash === '#history') return 'history';
    if (window.location.hash === '#admin') return 'admin';
  }
  return 'order';
}

export interface OrderDraft {
  serviceType: ServiceType;
  amount: number;
  accountHandle: string;
}

export default function App() {
  const initial = getInitialSession();
  const [user, setUser] = useState<UserProfile | null>(initial.user);
  const [orders, setOrders] = useState<FollowerOrder[]>(initial.orders);
  const [activePage, setActivePage] = useState<AppPage>(getInitialPage);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [showPublicAdmin, setShowPublicAdmin] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#admin'
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchUserOrdersApi(user.normalizedPhone)
      .then((serverOrders) => {
        if (!cancelled) {
          setOrders(serverOrders);
          saveOrdersForUser(user.normalizedPhone, serverOrders);
        }
      })
      .catch(() => {
        // Keep local cache if offline
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleNavigate = (page: AppPage) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      if (page === 'history') window.location.hash = '#history';
      else if (page === 'admin') window.location.hash = '#admin';
      else window.location.hash = '#order';
    }
  };

  const handleLoginSuccess = (
    loggedInUser: UserProfile,
    serverOrders: FollowerOrder[]
  ) => {
    saveUserSession(loggedInUser);
    saveOrdersForUser(loggedInUser.normalizedPhone, serverOrders);
    setUser(loggedInUser);
    setOrders(serverOrders);
    setOrderDraft(null);
    setShowPublicAdmin(false);
    handleNavigate('order');
  };

  const handleLogout = () => {
    clearUserSession();
    setUser(null);
    setOrders([]);
    setOrderDraft(null);
    setShowPublicAdmin(false);
    handleNavigate('order');
  };

  const handleSubmitOrder = async (params: {
    serviceType: ServiceType;
    amount: number;
    accountHandle: string;
  }): Promise<FollowerOrder> => {
    if (!user) {
      throw new Error('يرجى تسجيل الدخول أولاً.');
    }
    const response = await createOrderApi({
      userPhone: user.normalizedPhone,
      userName: user.fullName,
      serviceType: params.serviceType,
      amount: params.amount,
      accountHandle: params.accountHandle,
    });
    setOrders(response.orders);
    saveOrdersForUser(user.normalizedPhone, response.orders);
    setOrderDraft(null);
    return response.order;
  };

  const handleReorder = (order: FollowerOrder) => {
    setOrderDraft({
      serviceType: order.serviceType || 'followers',
      amount: order.followersCount,
      accountHandle: order.accountHandle,
    });
    handleNavigate('order');
  };

  if (!user) {
    if (showPublicAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200">
            <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
              <span className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
                طلب الفلوس
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPublicAdmin(false);
                  if (typeof window !== 'undefined') window.location.hash = '#order';
                }}
                className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </div>
          </header>
          <main className="flex-1">
            <AdminInbox
              onBack={() => {
                setShowPublicAdmin(false);
                if (typeof window !== 'undefined') window.location.hash = '#order';
              }}
            />
          </main>
        </div>
      );
    }

    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onOpenAdmin={() => {
          setShowPublicAdmin(true);
          if (typeof window !== 'undefined') window.location.hash = '#admin';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        activePage={activePage}
        ordersCount={orders.length}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activePage === 'order' ? (
          <OrderDashboard
            user={user}
            orders={orders}
            orderDraft={orderDraft}
            onClearDraft={() => setOrderDraft(null)}
            onSubmitOrder={handleSubmitOrder}
            onNavigate={handleNavigate}
          />
        ) : activePage === 'history' ? (
          <OrdersHistory
            orders={orders}
            onNavigate={handleNavigate}
            onReorder={handleReorder}
          />
        ) : (
          <AdminInbox />
        )}
      </main>
    </div>
  );
}
