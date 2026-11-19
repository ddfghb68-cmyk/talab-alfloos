import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_MAX_FOLLOWERS,
  DAILY_MAX_LIKES,
  buildOrdersCsv,
  createFollowerOrder,
  getLocalDayKey,
  getRemainingDailyFollowers,
  getRemainingForService,
  getTimeUntilDailyResetLabel,
  getTodayUsedFollowers,
  normalizePhone,
  validateFollowerOrder,
  validateLogin,
  validateServiceOrder,
} from './orderRules.ts';
import type { FollowerOrder, UserProfile } from './types.ts';

const sampleUser: UserProfile = {
  fullName: 'سعيد العلوي',
  phone: '0612345678',
  normalizedPhone: '0612345678',
  loggedInAt: '2026-11-18T10:00:00.000Z',
};

test('validateLogin enforces full name, valid phone, and exact password ادم', () => {
  const wrongPassword = validateLogin({
    fullName: 'سعيد العلوي',
    phone: '0612345678',
    password: '123',
  });
  assert.equal(wrongPassword.valid, false);
  assert.ok(wrongPassword.error?.includes('كلمة المرور'));

  const validArabicDigits = validateLogin({
    fullName: '  سعيد   العلوي ',
    phone: '٠٦١٢٣٤٥٦٧٨',
    password: ' ادم ',
  });
  assert.equal(validArabicDigits.valid, true);
  assert.equal(validArabicDigits.fullName, 'سعيد العلوي');
  assert.equal(validArabicDigits.normalizedPhone, '0612345678');
});

test('normalizePhone strips spaces and converts Arabic numerals', () => {
  assert.equal(normalizePhone('+212 612-345-678'), '+212612345678');
  assert.equal(normalizePhone('٠٦٥٥٤٤٣٣٢٢'), '0655443322');
});

test('daily quota tracks followers (200) and likes (100) independently', () => {
  const today = new Date(2026, 10, 18, 14, 0, 0);
  const yesterday = new Date(2026, 10, 17, 14, 0, 0);

  const orders: FollowerOrder[] = [
    createFollowerOrder({
      amount: 200,
      accountHandle: '@old_account',
      serviceType: 'followers',
      user: sampleUser,
      existingOrdersCount: 0,
      now: yesterday,
    }),
    createFollowerOrder({
      amount: 120,
      accountHandle: '@casa_style',
      serviceType: 'followers',
      user: sampleUser,
      existingOrdersCount: 1,
      now: today,
    }),
    createFollowerOrder({
      amount: 60,
      accountHandle: '@casa_style',
      serviceType: 'likes',
      user: sampleUser,
      existingOrdersCount: 2,
      now: today,
    }),
  ];

  assert.equal(getTodayUsedFollowers(orders, today), 120);
  assert.equal(getRemainingDailyFollowers(orders, today), 80);
  assert.equal(getRemainingForService(orders, 'likes', today), 40);

  const overFollowers = validateFollowerOrder('81', orders, today, '@casa_style');
  assert.equal(overFollowers.valid, false);
  assert.ok(overFollowers.error?.includes('80'));

  const overLikes = validateServiceOrder({
    rawAmount: '41',
    accountHandle: '@casa_style',
    serviceType: 'likes',
    orders,
    now: today,
  });
  assert.equal(overLikes.valid, false);
  assert.ok(overLikes.error?.includes('40'));

  const exactLikes = validateServiceOrder({
    rawAmount: '40',
    accountHandle: '@casa_style',
    serviceType: 'likes',
    orders,
    now: today,
  });
  assert.equal(exactLikes.valid, true);
  assert.equal(exactLikes.amount, 40);
  assert.equal(exactLikes.remainingAfter, 0);
});

test('validateServiceOrder requires accountHandle and rejects over daily max', () => {
  const today = new Date(2026, 10, 18, 14, 0, 0);

  const missingHandle = validateServiceOrder({
    rawAmount: '50',
    accountHandle: ' ',
    serviceType: 'likes',
    orders: [],
    now: today,
  });
  assert.equal(missingHandle.valid, false);
  assert.ok(missingHandle.error?.includes('اسم الحساب'));

  const overMaxLikes = validateServiceOrder({
    rawAmount: String(DAILY_MAX_LIKES + 1),
    accountHandle: '@morocco',
    serviceType: 'likes',
    orders: [],
    now: today,
  });
  assert.equal(overMaxLikes.valid, false);

  const overMaxFollowers = validateFollowerOrder(
    String(DAILY_MAX_FOLLOWERS + 1),
    [],
    today,
    '@morocco'
  );
  assert.equal(overMaxFollowers.valid, false);
});

test('createFollowerOrder assigns prefixes and buildOrdersCsv includes accountHandle', () => {
  const now = new Date(2026, 10, 18, 15, 30, 0);
  const likeOrder = createFollowerOrder({
    amount: 75,
    accountHandle: '@morocco_star',
    serviceType: 'likes',
    user: sampleUser,
    existingOrdersCount: 2,
    now,
  });

  assert.equal(likeOrder.followersCount, 75);
  assert.equal(likeOrder.serviceType, 'likes');
  assert.equal(likeOrder.serviceLabel, 'لايكات');
  assert.equal(likeOrder.orderNumber, 'LK-003');
  assert.equal(likeOrder.dayKey, getLocalDayKey(now));

  const csv = buildOrdersCsv([likeOrder]);
  assert.ok(csv.includes('@morocco_star'));
  assert.ok(csv.includes('لايكات'));
});

test('getTimeUntilDailyResetLabel formats hours and minutes remaining until midnight', () => {
  const afternoon = new Date(2026, 10, 18, 21, 30, 0);
  assert.equal(
    getTimeUntilDailyResetLabel(afternoon),
    'يتجدد الحد اليومي بعد 2 ساعة و30 دقيقة'
  );
});
