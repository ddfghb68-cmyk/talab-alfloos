import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Clock,
  Heart,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  DAILY_MAX_FOLLOWERS,
  DAILY_MAX_LIKES,
  formatArabicDateTime,
  getRemainingForService,
  getServiceConfig,
  getTimeUntilDailyResetLabel,
  getTodayUsedForService,
  validateServiceOrder,
} from '../lib/orderRules';
import type { OrderDraft } from '../App';
import type { AppPage, FollowerOrder, ServiceType, UserProfile } from '../lib/types';

interface OrderDashboardProps {
  user: UserProfile;
  orders: FollowerOrder[];
  orderDraft: OrderDraft | null;
  onClearDraft: () => void;
  onSubmitOrder: (params: {
    serviceType: ServiceType;
    amount: number;
    accountHandle: string;
  }) => Promise<FollowerOrder>;
  onNavigate: (page: AppPage) => void;
}

export function OrderDashboard({
  user,
  orders,
  orderDraft,
  onClearDraft,
  onSubmitOrder,
  onNavigate,
}: OrderDashboardProps) {
  const [serviceType, setServiceType] = useState<ServiceType>('followers');
  const [amountInput, setAmountInput] = useState('');
  const [accountHandle, setAccountHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<FollowerOrder | null>(null);

  const usedFollowers = getTodayUsedForService(orders, 'followers');
  const remainingFollowers = getRemainingForService(orders, 'followers');
  const followersProgress = Math.min(
    100,
    Math.round((usedFollowers / DAILY_MAX_FOLLOWERS) * 100)
  );

  const usedLikes = getTodayUsedForService(orders, 'likes');
  const remainingLikes = getRemainingForService(orders, 'likes');
  const likesProgress = Math.min(
    100,
    Math.round((usedLikes / DAILY_MAX_LIKES) * 100)
  );

  const activeConfig = getServiceConfig(serviceType);
  const remainingActive =
    serviceType === 'likes' ? remainingLikes : remainingFollowers;
  const resetLabel = getTimeUntilDailyResetLabel();
  const recentOrders = orders.slice(0, 3);

  useEffect(() => {
    if (!orderDraft) return;
    const draftService = orderDraft.serviceType ?? 'followers';
    const remainingForDraft = getRemainingForService(orders, draftService);
    setServiceType(draftService);
    setAccountHandle(orderDraft.accountHandle ?? '');
    if (remainingForDraft > 0) {
      const safeAmount = Math.min(orderDraft.amount, remainingForDraft);
      setAmountInput(String(safeAmount));
      setError(null);
      setConfirmedOrder(null);
    } else {
      const cfg = getServiceConfig(draftService);
      setAmountInput('');
      setError(
        `لقد استنفدت الحد اليومي لخدمة ${cfg.label} (${cfg.dailyMax}). ${getTimeUntilDailyResetLabel()}.`
      );
    }
    onClearDraft();
  }, [orderDraft, orders, onClearDraft]);

  const handleServiceChange = (nextService: ServiceType) => {
    setServiceType(nextService);
    setAmountInput('');
    setError(null);
    setConfirmedOrder(null);
  };

  const handlePresetClick = (preset: number) => {
    const safeAmount = Math.min(preset, remainingActive);
    if (safeAmount <= 0) {
      setError(
        `لقد وصلت إلى الحد الأقصى اليومي لخدمة ${activeConfig.label} (${activeConfig.dailyMax}).`
      );
      return;
    }
    setAmountInput(String(safeAmount));
    setError(null);
    setConfirmedOrder(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateServiceOrder({
      rawAmount: amountInput,
      accountHandle,
      serviceType,
      orders,
    });

    if (
      !validation.valid ||
      validation.amount === undefined ||
      !validation.accountHandle
    ) {
      setError(validation.error ?? 'تعذر التحقق من الطلب.');
      setConfirmedOrder(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await onSubmitOrder({
        serviceType,
        amount: validation.amount,
        accountHandle: validation.accountHandle,
      });
      setConfirmedOrder(created);
      setAmountInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الطلب.');
      setConfirmedOrder(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 md:pb-12">
      <section className="mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            مرحباً، {user.fullName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span dir="ltr" className="tabular-nums">
              {user.phone}
            </span>
            <span aria-hidden="true">·</span>
            <span>فولورز مغربي: حتى 200 يومياً</span>
            <span aria-hidden="true">·</span>
            <span>لايكات: حتى 100 يومياً</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 whitespace-nowrap">
                طلب {activeConfig.label}
              </h2>
              <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
                المتبقي اليوم: {remainingActive} / {activeConfig.dailyMax}
              </span>
            </div>

            <div
              role="tablist"
              aria-label="اختيار نوع الطلب"
              className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={serviceType === 'followers'}
                onClick={() => handleServiceChange('followers')}
                className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                  serviceType === 'followers'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>فولورز مغربي (200)</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={serviceType === 'likes'}
                onClick={() => handleServiceChange('likes')}
                className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                  serviceType === 'likes'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Heart className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>لايكات (100)</span>
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              أدخل اسم حسابك ثم حدد عدد {activeConfig.label} المطلوب (الحد الأقصى{' '}
              {activeConfig.dailyMax} في اليوم الواحد).
            </p>

            {confirmedOrder && (
              <div
                role="status"
                aria-live="polite"
                className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-emerald-900">
                      تم تسجيل طلبك بنجاح
                    </p>
                    <p className="mt-1 text-sm text-emerald-800 tabular-nums">
                      رقم الطلب {confirmedOrder.orderNumber} ·{' '}
                      {confirmedOrder.followersCount}{' '}
                      {confirmedOrder.serviceLabel || activeConfig.label} ·{' '}
                      <span dir="ltr">{confirmedOrder.accountHandle}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('history')}
                      className="mt-2.5 text-xs font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 cursor-pointer"
                    >
                      الانتقال إلى صفحة الطلبات السابقة
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="accountHandle"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  اسم الحساب أو الرابط (مطلوب)
                </label>
                <div className="relative">
                  <AtSign
                    className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="accountHandle"
                    name="accountHandle"
                    type="text"
                    required
                    value={accountHandle}
                    disabled={remainingActive <= 0 || isSubmitting}
                    onChange={(e) => {
                      setAccountHandle(e.target.value);
                      if (error) setError(null);
                      if (confirmedOrder) setConfirmedOrder(null);
                    }}
                    placeholder="@username"
                    dir="ltr"
                    className="w-full min-h-[46px] pr-10 pl-4 py-2.5 text-sm sm:text-base text-right text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="followersAmount"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  عدد {activeConfig.label}
                </label>
                <div className="relative">
                  {serviceType === 'likes' ? (
                    <Heart
                      className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <Users
                      className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                  <input
                    id="followersAmount"
                    name="followersAmount"
                    type="text"
                    inputMode="numeric"
                    value={amountInput}
                    disabled={remainingActive <= 0 || isSubmitting}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      if (error) setError(null);
                      if (confirmedOrder) setConfirmedOrder(null);
                    }}
                    placeholder={
                      remainingActive > 0
                        ? `اكتب العدد من 1 إلى ${remainingActive}`
                        : `اكتمل الحد اليومي (${activeConfig.dailyMax})`
                    }
                    className="w-full min-h-[50px] pr-10 pl-4 py-2.5 text-base font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100 disabled:text-slate-500 transition-colors tabular-nums"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 ml-1">اختيار سريع:</span>
                  {activeConfig.presets.map((preset) => {
                    const isDisabled = remainingActive <= 0 || preset > remainingActive;
                    const isSelected = !isDisabled && amountInput === String(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={isDisabled || isSubmitting}
                        onClick={() => handlePresetClick(preset)}
                        className={`min-h-[40px] px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-colors tabular-nums whitespace-nowrap ${
                          isDisabled
                            ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                            : isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 cursor-pointer'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                  {remainingActive > 0 &&
                    remainingActive < activeConfig.dailyMax &&
                    !activeConfig.presets.includes(remainingActive) && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handlePresetClick(remainingActive)}
                        className={`min-h-[40px] px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-colors tabular-nums whitespace-nowrap cursor-pointer ${
                          amountInput === String(remainingActive)
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        المتبقي ({remainingActive})
                      </button>
                    )}
                </div>
              </div>

              {remainingActive <= 0 && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 p-3.5 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <Clock
                    className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    وصلت إلى الحد اليومي الكامل لخدمة {activeConfig.label} (
                    {activeConfig.dailyMax}). {resetLabel}.
                  </span>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle
                    className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={remainingActive <= 0 || isSubmitting}
                className="w-full min-h-[48px] px-6 py-3 text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-[0.99] rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck
              className="w-4 h-4 text-emerald-700 shrink-0"
              aria-hidden="true"
            />
            <span>حقيقي وآمن · لا يتطلب التطبيق أي معلومات بنكية.</span>
          </div>
        </section>

        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 mb-5">
              ملخص الحصة اليومية
            </h2>

            <div className="space-y-5 mb-6">
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    فولورز مغربي
                  </span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {usedFollowers}{' '}
                    <span className="text-xs font-normal text-slate-500">/ 200</span>
                  </span>
                </div>
                <div
                  className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={usedFollowers}
                  aria-valuemin={0}
                  aria-valuemax={DAILY_MAX_FOLLOWERS}
                  aria-label="استخدام الفولورز المغربي اليومي من أصل 200"
                >
                  <div
                    className="h-full bg-emerald-700 transition-all duration-300"
                    style={{ width: `${followersProgress}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>المتبقي: {remainingFollowers}</span>
                  <span>{followersProgress}%</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">لايكات</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {usedLikes}{' '}
                    <span className="text-xs font-normal text-slate-500">/ 100</span>
                  </span>
                </div>
                <div
                  className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={usedLikes}
                  aria-valuemin={0}
                  aria-valuemax={DAILY_MAX_LIKES}
                  aria-label="استخدام اللايكات اليومي من أصل 100"
                >
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${likesProgress}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>المتبقي: {remainingLikes}</span>
                  <span>{likesProgress}%</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  آخر الطلبات
                </h3>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigate('history')}
                    className="text-xs font-medium text-emerald-800 hover:text-emerald-900 underline underline-offset-4 cursor-pointer"
                  >
                    عرض الكل ({orders.length})
                  </button>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 leading-relaxed">
                  لم تقم بأي طلبات بعد. اختر الفولورز أو اللايكات وأدخل اسم حسابك ثم اضغط على تأكيد الطلب.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <li
                      key={order.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">
                          {order.followersCount}{' '}
                          {order.serviceLabel ||
                            (order.serviceType === 'likes'
                              ? 'لايكات'
                              : 'فولورز مغربي')}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {order.accountHandle} ·{' '}
                          {formatArabicDateTime(order.createdAt)}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-emerald-800 whitespace-nowrap shrink-0">
                        {order.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 space-y-1 text-xs text-slate-500 leading-relaxed">
            <p>
              الحد اليومي: 200 فولورز مغربي و100 لايك يومياً لضمان استقرار حسابك.
            </p>
            <p className="text-slate-600 font-medium tabular-nums">{resetLabel}.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
