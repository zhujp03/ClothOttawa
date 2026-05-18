import { prisma } from './prisma.js';
import { cleanupExpiredPaymentSessions, finalizePaidSession } from './payment-sessions.js';
import { findEtransferMatch, isEtransferMonitorConfigured } from './etransfer.js';
import { sendOrderPlacedEmail } from './email.js';

const DEFAULT_INTERVAL_MS = 1000;
let timer = null;
let running = false;
let lastScanFinishedAt = 0;

async function sendOrderPlacedEmailOnce({ sessionId, order }) {
  if (!sessionId || !order?.id) return;
  const updated = await prisma.paymentSession.updateMany({
    where: {
      id: sessionId,
      confirmationEmailSentAt: null
    },
    data: {
      confirmationEmailSentAt: new Date()
    }
  });

  if (updated.count !== 1) return;

  const customer = await prisma.customerUser.findUnique({
    where: { id: order.customerId },
    select: { email: true, firstName: true }
  });

  if (!customer?.email) return;

  await sendOrderPlacedEmail({
    email: customer.email,
    firstName: customer.firstName || '',
    orderNumber: order.orderNumber
  });
}

async function scanPendingEtransferSessions() {
  if (!isEtransferMonitorConfigured() || running) return;
  if (Date.now() - lastScanFinishedAt < 700) return;
  running = true;

  try {
    await cleanupExpiredPaymentSessions();

    const sessions = await prisma.paymentSession.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: 'ETRANSFER',
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        totalCents: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    for (const session of sessions) {
      const match = await findEtransferMatch({
        totalCents: session.totalCents,
        createdAt: session.createdAt
      });

      if (!match?.matched) continue;

      if (match.matchRef) {
        const alreadyUsed = await prisma.paymentSession.findFirst({
          where: {
            etransferMatchRef: match.matchRef,
            id: { not: session.id }
          },
          select: { id: true }
        });
        if (alreadyUsed) continue;
      }

      await prisma.paymentSession.update({
        where: { id: session.id },
        data: {
          etransferMatchedAt: match.matchedAt || new Date(),
          etransferMatchRef: match.matchRef || null
        }
      });

      const order = await finalizePaidSession({
        paymentSessionId: session.id,
        paymentMethod: 'ETRANSFER',
        paymentReference: match.matchRef || null
      });

      await sendOrderPlacedEmailOnce({ sessionId: session.id, order });
    }
  } catch (error) {
    console.warn('[etransfer-runner] scan failed', error?.message || error);
  } finally {
    running = false;
    lastScanFinishedAt = Date.now();
  }
}

export function startEtransferMonitor() {
  if (!isEtransferMonitorConfigured()) {
    console.log('[etransfer-runner] disabled (missing Gmail IMAP config)');
    return;
  }
  if (timer) return;
  const intervalMs = Math.max(1000, Number(process.env.ETRANSFER_MONITOR_INTERVAL_MS || DEFAULT_INTERVAL_MS));
  timer = setInterval(scanPendingEtransferSessions, intervalMs);
  scanPendingEtransferSessions().catch(() => {});
  console.log(`[etransfer-runner] active, polling every ${intervalMs}ms`);
}
