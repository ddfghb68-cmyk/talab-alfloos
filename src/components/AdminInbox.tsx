import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Inbox,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { fetchAdminSubmissionsApi } from '../lib/api';
import { buildOrdersCsv, formatArabicDateTime } from '../lib/orderRules';
import type { FollowerOrder, RegistrationRecord } from '../lib/types';

interface AdminInboxProps {
  onBack?: () => void;
}

type InboxTab = 'orders' | 'registrations';
type ServiceFilter = 'all' | 'followers' | 'likes';

export function AdminInbox({ onBack }: AdminInboxProps) {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [orders, setOrders] = useState<FollowerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>('orders');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSubmissionsApi();
      setRegistrations(data.registrations);
      setOrders(data.orders);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'تعذر تحميل الطلبات الواردة.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const orderService = order.serviceType || 'followers';
      if (serviceFilter !== 'all' && orderService !== serviceFilter) {
        return false;
      }
      if (!query) return true;
      return (
        order.accountHandle.toLowerCase().includes(query) ||
        order.userName.toLowerCase().includes(query) ||
        order.userPhone.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query)
      );
    });
  }, [orders, serviceFilter, searchQuery]);

  const filteredRegistrations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return registrations;
    return registrations.filter(
      (reg) =>
        reg.fullName.toLowerCase().includes(query) ||
        reg.phone.toLowerCase().includes(query)
    );
  }, [registrations, searchQuery]);

  const followersOrdersCount = useMemo(
    () => orders.filter((o) => (o.serviceType || 'followers') === 'followers').length,
    [orders]
  );

  const likesOrdersCount = useMemo(
    () => orders.filter((o) => o.serviceType === 'likes').length,
    [orders]
  );

  const handleCopyAccount = async (id: string, value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Clipboard API fallback
    }
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 1800);
  };

  const handleExportCsv = () => {
    const csv = buildOrdersCsv(filteredOrders);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `talab_alfolous_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 md:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            الطلبات الواردة والحسابات
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            هنا تصل أسماء الحسابات والطلبات فور تسجيل المستخدمين وإرسال طلبات الفولورز أو اللايكات.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              رجوع للدخول
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadData()}
            className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>تحديث</span>
          </button>
          {filteredOrders.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>تصدير CSV</span>
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <dt className="text-xs font-medium text-slate-500">المسجلون</dt>
          <dd className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            {registrations.length}
          </dd>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <dt className="text-xs font-medium text-slate-500">إجمالي الطلبات</dt>
          <dd className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            {orders.length}
          </dd>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <dt className="text-xs font-medium text-slate-500">طلبات الفولورز</dt>
          <dd className="mt-1.5 text-2xl font-bold text-emerald-800 tabular-nums">
            {followersOrdersCount}
          </dd>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <dt className="text-xs font-medium text-slate-500">طلبات اللايكات</dt>
          <dd className="mt-1.5 text-2xl font-bold text-emerald-800 tabular-nums">
            {likesOrdersCount}
          </dd>
        </div>
      </dl>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label="أقسام الإدارة"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'orders'}
                onClick={() => setActiveTab('orders')}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الطلبات والحسابات ({orders.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'registrations'}
                onClick={() => setActiveTab('registrations')}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'registrations'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                المسجلون ({registrations.length})
              </button>
            </div>

            {activeTab === 'orders' && (
              <div
                role="group"
                aria-label="تصفية حسب الخدمة"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => setServiceFilter('all')}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    serviceFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter('followers')}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    serviceFilter === 'followers'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  فولورز
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter('likes')}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    serviceFilter === 'likes'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  لايكات
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full md:w-64">
            <Search
              className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="adminSearch" className="sr-only">
              بحث باسم الحساب أو الاسم أو الهاتف
            </label>
            <input
              id="adminSearch"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالحساب أو الاسم أو الهاتف..."
              className="w-full min-h-[42px] pr-9 pl-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-700 transition-colors"
            />
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center text-sm text-red-700">{error}</div>
        ) : isLoading ? (
          <div className="p-6 space-y-3" aria-label="جاري التحميل">
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ) : activeTab === 'orders' ? (
          filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-slate-600">
                لا توجد طلبات واردة مطابقة حالياً.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                      <th className="py-3.5 px-6">اسم الحساب المطلوب</th>
                      <th className="py-3.5 px-6">الخدمة والكمية</th>
                      <th className="py-3.5 px-6">صاحب الطلب</th>
                      <th className="py-3.5 px-6">رقم الهاتف</th>
                      <th className="py-3.5 px-6">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredOrders.map((order) => {
                      const isCopied = copiedId === order.id;
                      const serviceName =
                        order.serviceLabel ||
                        (order.serviceType === 'likes' ? 'لايكات' : 'فولورز مغربي');
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            <div className="inline-flex items-center gap-2">
                              <span dir="ltr">{order.accountHandle}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCopyAccount(order.id, order.accountHandle)
                                }
                                aria-label={`نسخ اسم الحساب ${order.accountHandle}`}
                                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {isCopied ? (
                                  <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                                ) : (
                                  <Copy className="w-4 h-4" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-emerald-800 tabular-nums">
                            {order.followersCount} {serviceName}
                          </td>
                          <td className="py-4 px-6 text-slate-800">{order.userName}</td>
                          <td className="py-4 px-6 text-slate-600 tabular-nums" dir="ltr">
                            <span className="block text-right">{order.userPhone}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 tabular-nums">
                            {formatArabicDateTime(order.createdAt)}
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
                    <li key={order.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span dir="ltr" className="text-base font-bold text-slate-900">
                          {order.accountHandle}
                        </span>
                        <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                          {order.followersCount} {serviceName}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                        <span>{order.userName}</span>
                        <span aria-hidden="true">·</span>
                        <span dir="ltr">{order.userPhone}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatArabicDateTime(order.createdAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyAccount(order.id, order.accountHandle)
                        }
                        className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                            <span>تم نسخ الحساب</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>نسخ اسم الحساب</span>
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-slate-600">لا يوجد مسجلون حالياً.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredRegistrations.map((reg) => (
              <li
                key={reg.id}
                className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{reg.fullName}</p>
                  <p className="text-xs text-slate-500 tabular-nums" dir="ltr">
                    {reg.phone}
                  </p>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  تاريخ التسجيل: {formatArabicDateTime(reg.registeredAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
