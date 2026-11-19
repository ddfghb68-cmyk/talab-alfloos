import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  createFollowerOrder,
  normalizePhone,
  validateLogin,
  validateServiceOrder,
} from './src/lib/orderRules.ts';
import type {
  FollowerOrder,
  RegistrationRecord,
  ServiceType,
  UserProfile,
} from './src/lib/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface StoreSchema {
  registrations: RegistrationRecord[];
  orders: FollowerOrder[];
}

function readStore(): StoreSchema {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return { registrations: [], orders: [] };
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreSchema>;
    return {
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return { registrations: [], orders: [] };
  }
}

function writeStore(store: StoreSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

async function notifyWebhook(event: string, payload: unknown): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), payload }),
    });
  } catch {
    // Non-blocking notification
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/login', async (req, res) => {
    const body = req.body ?? {};
    const validation = validateLogin({
      fullName: String(body.fullName ?? ''),
      phone: String(body.phone ?? ''),
      password: String(body.password ?? ''),
    });

    if (
      !validation.valid ||
      !validation.fullName ||
      !validation.phone ||
      !validation.normalizedPhone
    ) {
      res.status(400).json({ error: validation.error ?? 'بيانات الدخول غير صالحة.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const user: UserProfile = {
      fullName: validation.fullName,
      phone: validation.phone,
      normalizedPhone: validation.normalizedPhone,
      loggedInAt: nowIso,
    };

    const store = readStore();
    const existingIndex = store.registrations.findIndex(
      (r) => r.normalizedPhone === user.normalizedPhone
    );

    if (existingIndex >= 0) {
      store.registrations[existingIndex] = {
        ...store.registrations[existingIndex],
        fullName: user.fullName,
        phone: user.phone,
        lastSeenAt: nowIso,
      };
    } else {
      store.registrations.unshift({
        id: `usr_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
        fullName: user.fullName,
        phone: user.phone,
        normalizedPhone: user.normalizedPhone,
        registeredAt: nowIso,
        lastSeenAt: nowIso,
      });
    }

    writeStore(store);
    void notifyWebhook('user_registered', user);

    const userOrders = store.orders.filter(
      (order) => order.userPhone === user.normalizedPhone
    );

    res.json({ user, orders: userOrders });
  });

  app.get('/api/orders', (req, res) => {
    const rawPhone = String(req.query.phone ?? '');
    const normalizedPhone = normalizePhone(rawPhone);
    if (!normalizedPhone) {
      res.status(400).json({ error: 'رقم الهاتف مطلوب.' });
      return;
    }
    const store = readStore();
    const orders = store.orders.filter(
      (order) => order.userPhone === normalizedPhone
    );
    res.json({ orders });
  });

  app.post('/api/orders', async (req, res) => {
    const body = req.body ?? {};
    const rawPhone = String(body.userPhone ?? '');
    const normalizedPhone = normalizePhone(rawPhone);
    const userName = String(body.userName ?? '').trim();
    const serviceType: ServiceType =
      body.serviceType === 'likes' ? 'likes' : 'followers';
    const rawAmount = String(body.amount ?? '');
    const accountHandle = String(body.accountHandle ?? '');

    if (!normalizedPhone || !userName) {
      res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً.' });
      return;
    }

    const store = readStore();
    const userOrders = store.orders.filter(
      (order) => order.userPhone === normalizedPhone
    );

    const validation = validateServiceOrder({
      rawAmount,
      accountHandle,
      serviceType,
      orders: userOrders,
    });

    if (
      !validation.valid ||
      validation.amount === undefined ||
      !validation.accountHandle
    ) {
      res.status(400).json({ error: validation.error ?? 'تعذر التحقق من الطلب.' });
      return;
    }

    const order = createFollowerOrder({
      amount: validation.amount,
      accountHandle: validation.accountHandle,
      serviceType,
      user: {
        fullName: userName,
        phone: rawPhone,
        normalizedPhone,
        loggedInAt: new Date().toISOString(),
      },
      existingOrdersCount: store.orders.length,
    });

    store.orders.unshift(order);
    writeStore(store);
    void notifyWebhook('order_created', order);

    const updatedUserOrders = store.orders.filter(
      (item) => item.userPhone === normalizedPhone
    );

    res.status(201).json({ order, orders: updatedUserOrders });
  });

  app.get('/api/admin/submissions', (_req, res) => {
    const store = readStore();
    res.json({
      registrations: store.registrations,
      orders: store.orders,
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
