import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  PlusCircle,
  RotateCcw,
  Search,
} from 'lucide-react';
import { formatArabicDateTime, getLocalDayKey } from '../lib/orderRules';
import type { AppPage, FollowerOrder } from '../lib/types';

interface OrdersHistoryProps {
  orders: FollowerOrder[];
  onNavigate: (page: AppPage) => void;
  onReorder: (order: FollowerOrder) => void;
}

type HistoryFilter = 'all' | 'followers' | 'likes' | 'today';

export function OrdersHistory({
  orders,
  onNavigate,
  onReorder,
}: OrdersHistoryProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const todayKey = getLocalDayKey();

  const handleCopyOrderNumber = async (order: FollowerOrder) => {
    try {
      await navigator.clipboard?.writeText(order.orderNumber);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
    setCopiedId(order.id);
    window.setTimeout(() => {
      setCopiedId((current) => (current === order.id ? null : current));
    }, 1800);
  };

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const orderService = order.serviceType || 'followers';
      const orderDay = order.dayKey || getLocalDayKey(order.createdAt);
      if (filter === 'followers' && orderService !== 'followers') return false;
      if (filter === 'likes' && orderService !== 'likes') return false;
      if (filter === 'today' && orderDay !== todayKey) return false;

      if (!query) return true;
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        String(order.followersCount).includes(query) ||
        (order.accountHandle?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [orders, filter, searchQuery, todayKey]);

  const totalFollowers = useMemo(
    () =>
      orders
        .filter((o) => (o.serviceType || 'followers') === 'followers')
        .reduce((sum, item) => sum + item.followersCount, 0),
    [orders]
  );

  const totalLikes = useMemo(
    () =>
      orders
        .filter((o) => o.serviceType === 'likes')
        .reduce((sum, item) => sum + item.followersCount, 0),
    [orders]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 md:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            طلباتي السابقة
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 tabular-nums">
            <span>الطلبات: {orders.length}</span>
            <span aria-hidden="true">·</span>
            <span>الفولورز: {totalFollowers}</span>
            <span aria-hidden="true">·</span>
            <span>اللايكات: {totalLikes}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('order')}
          className="hidden md:flex min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>طلب جديد</span>
        </button>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            role="group"
            aria-label="تصفية الطلبات"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl self-start"
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('followers')}
              className={`min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'followers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فولورز
            </button>
            <button
              type="button"
              onClick={() => setFilter('likes')}
              className={`min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'likes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              لايكات
            </button>
            <button
              type="button"
              onClick={() => setFilter('today')}
              className={`min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'today'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="ordersSearch" className="sr-only">
              بحث في الطلبات السابقة
            </label>
            <input
              id="ordersSearch"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الطلب أو الحساب..."
              className="w-full min-h-[42px] pr-9 pl-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-700 transition-colors"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 sm:p-14 text-center">
            <ClipboardList
              className="w-10 h-10 text-slate-300 mx-auto mb-3"
              aria-hidden="true"
            />
            <h2 className="font-display text-lg font-bold text-slate-900 mb-1.5">
              لا توجد طلبات سابقة حتى الآن
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
              عند إرسال أول طلب للفولورز المغربي أو اللايكات سيظهر هنا مع اسم الحساب والتاريخ.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('order')}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
            >
              إرسال أول طلب
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-600 mb-4">
              لا توجد طلبات مطابقة لخيار البحث أو التصفية الحالي.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="min-h-[40px] px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              إعادة ضبط التصفية
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-6">رقم الطلب</th>
                    <th className="py-3.5 px-6">الطلب</th>
                    <th className="py-3.5 px-6">اسم الحساب</th>
                    <th className="py-3.5 px-6">التاريخ والوقت</th>
                    <th className="py-3.5 px-6">الحالة</th>
                    <th className="py-3.5 px-6">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrders.map((order) => {
                    const isCopied = copiedId === order.id;
                    const serviceName =
                      order.serviceLabel ||
                      (order.serviceType === 'likes' ? 'لايكات' : 'فولورز مغربي');
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-4 px-6 font-semibold text-slate-900 tabular-nums">
                          <div className="inline-flex items-center gap-1.5">
                            <span>{order.orderNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyOrderNumber(order)}
                              aria-label={`نسخ رقم الطلب ${order.orderNumber}`}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900 tabular-nums">
                          {order.followersCount} {serviceName}
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-medium" dir="ltr">
                          <span className="block text-right">
                            {order.accountHandle || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 tabular-nums">
                          {formatArabicDateTime(order.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span>{order.status}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() => onReorder(order)}
                            className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>إعادة الطلب</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const isCopied = copiedId === order.id;
                const serviceName =
                  order.serviceLabel ||
                  (order.serviceType === 'likes' ? 'لايكات' : 'فولورز مغربي');
                return (
                  <li key={order.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {order.followersCount} {serviceName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{order.status}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span>{order.orderNumber}</span>
                      {order.accountHandle && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span dir="ltr" className="font-medium text-slate-700">
                            {order.accountHandle}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{formatArabicDateTime(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onReorder(order)}
                        className="min-h-[40px] px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>إعادة الطلب</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyOrderNumber(order)}
                        className="min-h-[40px] px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>نسخ الرقم</span>
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
