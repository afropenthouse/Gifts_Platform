const prisma = require('../prismaClient');
const { initiateTransfer, createTransferRecipient } = require('./paystack');
const { Prisma } = require('@prisma/client');
const { sendVendorPaymentReminderEmail } = require('./emailService');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function triggerVendorDuePaymentReminderEmail({ recipientEmail, reminderType, force = false }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const threeDayStart = addDays(todayStart, 3);
  const threeDayEnd = addDays(todayStart, 4);

  const rows = await prisma.$queryRaw`
    SELECT 
      v.id,
      v.category,
      v."dueDate",
      v."amountAgreed",
      v."amountPaid",
      v."scheduledAmount",
      (v."amountAgreed" - v."amountPaid" - v."scheduledAmount")::float8 AS balance,
      g.title AS "eventTitle",
      u.email AS "userEmail",
      u.name AS "userName"
    FROM "Vendor" v
    JOIN "Gift" g ON g.id = v."eventId"
    JOIN "User" u ON u.id = g."userId"
    WHERE u.email = ${recipientEmail}
      AND (v."amountAgreed" - v."amountPaid" - v."scheduledAmount") > 0
      AND (
        (${reminderType} = 'due_day' AND v."dueDate" >= ${todayStart} AND v."dueDate" < ${tomorrowStart})
        OR
        (${reminderType} = 'three_day' AND v."dueDate" >= ${threeDayStart} AND v."dueDate" < ${threeDayEnd})
      )
    ORDER BY v."dueDate" ASC
  `;

  let list = Array.isArray(rows) ? rows : [];
  const first = list[0];

  if (force && list.length === 0) {
    const fallbackRows = await prisma.$queryRaw`
      SELECT 
        v.id,
        v.category,
        v."dueDate",
        v."amountAgreed",
        v."amountPaid",
        v."scheduledAmount",
        (v."amountAgreed" - v."amountPaid" - v."scheduledAmount")::float8 AS balance,
        g.title AS "eventTitle",
        u.email AS "userEmail",
        u.name AS "userName"
      FROM "Vendor" v
      JOIN "Gift" g ON g.id = v."eventId"
      JOIN "User" u ON u.id = g."userId"
      WHERE u.email = ${recipientEmail}
        AND (v."amountAgreed" - v."amountPaid" - v."scheduledAmount") > 0
      ORDER BY v."dueDate" ASC
      LIMIT 5
    `;
    list = Array.isArray(fallbackRows) ? fallbackRows : [];
  }

  const title = reminderType === 'due_day' ? 'Vendor payments due today' : 'Vendor payments due in 3 days';
  const subtitle = reminderType === 'due_day'
    ? 'These payments are due today. Review and take action.'
    : 'These payments are due in 3 days. Review and prepare.';

  const result = await sendVendorPaymentReminderEmail({
    recipientEmail,
    recipientName: first?.userName,
    title,
    subtitle,
    vendors: list,
  });

  return { delivered: Boolean(result?.delivered), count: list.length, reminderType };
}

async function checkAndSendVendorDuePaymentReminders() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const threeDayStart = addDays(todayStart, 3);
  const threeDayEnd = addDays(todayStart, 4);

  const dueSoonRows = await prisma.$queryRaw`
    SELECT 
      v.id,
      v.category,
      v."dueDate",
      v."amountAgreed",
      v."amountPaid",
      v."scheduledAmount",
      (v."amountAgreed" - v."amountPaid" - v."scheduledAmount")::float8 AS balance,
      g.title AS "eventTitle",
      u.email AS "userEmail",
      u.name AS "userName",
      CASE 
        WHEN v."dueDate" >= ${todayStart} AND v."dueDate" < ${tomorrowStart} THEN 'due_day'
        WHEN v."dueDate" >= ${threeDayStart} AND v."dueDate" < ${threeDayEnd} THEN 'three_day'
        ELSE NULL
      END AS "reminderType"
    FROM "Vendor" v
    JOIN "Gift" g ON g.id = v."eventId"
    JOIN "User" u ON u.id = g."userId"
    WHERE (v."amountAgreed" - v."amountPaid" - v."scheduledAmount") > 0
      AND (
        (v."dueDate" >= ${todayStart} AND v."dueDate" < ${tomorrowStart} AND v."reminderDueDaySentAt" IS NULL)
        OR
        (v."dueDate" >= ${threeDayStart} AND v."dueDate" < ${threeDayEnd} AND v."reminder3DaysSentAt" IS NULL)
      )
  `;

  const rows = Array.isArray(dueSoonRows) ? dueSoonRows : [];
  const grouped = new Map();

  for (const row of rows) {
    if (!row?.userEmail || !row?.reminderType) continue;
    const key = `${row.userEmail}__${row.reminderType}`;
    const existing = grouped.get(key) || { userEmail: row.userEmail, userName: row.userName, reminderType: row.reminderType, vendors: [], ids: [] };
    existing.vendors.push(row);
    existing.ids.push(row.id);
    grouped.set(key, existing);
  }

  let threeDaySent = 0;
  let dueDaySent = 0;

  for (const group of grouped.values()) {
    const title = group.reminderType === 'due_day' ? 'Vendor payments due today' : 'Vendor payments due in 3 days';
    const subtitle = group.reminderType === 'due_day'
      ? 'These payments are due today. Review and take action.'
      : 'These payments are due in 3 days. Review and prepare.';

    const result = await sendVendorPaymentReminderEmail({
      recipientEmail: group.userEmail,
      recipientName: group.userName,
      title,
      subtitle,
      vendors: group.vendors,
    });

    if (result?.delivered) {
      const ids = group.ids.filter(Boolean);
      if (ids.length > 0) {
        if (group.reminderType === 'due_day') {
          await prisma.$executeRaw(
            Prisma.sql`UPDATE "Vendor" SET "reminderDueDaySentAt" = ${now} WHERE id IN (${Prisma.join(ids)})`
          );
          dueDaySent += 1;
        } else {
          await prisma.$executeRaw(
            Prisma.sql`UPDATE "Vendor" SET "reminder3DaysSentAt" = ${now} WHERE id IN (${Prisma.join(ids)})`
          );
          threeDaySent += 1;
        }
      }
    }
  }

  return { threeDaySent, dueDaySent };
}

async function sendVendorPaymentDigestEmail({ recipientEmail }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const lookaheadEnd = addDays(todayStart, 8);

  const rows = await prisma.$queryRaw`
    SELECT 
      v.id,
      v.category,
      v."dueDate",
      v."amountAgreed",
      v."amountPaid",
      v."scheduledAmount",
      (v."amountAgreed" - v."amountPaid" - v."scheduledAmount")::float8 AS balance,
      g.title AS "eventTitle",
      u.email AS "userEmail",
      u.name AS "userName"
    FROM "Vendor" v
    JOIN "Gift" g ON g.id = v."eventId"
    JOIN "User" u ON u.id = g."userId"
    WHERE u.email = ${recipientEmail}
      AND (v."amountAgreed" - v."amountPaid" - v."scheduledAmount") > 0
      AND v."dueDate" >= ${todayStart}
      AND v."dueDate" < ${lookaheadEnd}
    ORDER BY v."dueDate" ASC
  `;

  const list = Array.isArray(rows) ? rows : [];
  const first = list[0];
  const result = await sendVendorPaymentReminderEmail({
    recipientEmail,
    recipientName: first?.userName,
    title: 'Upcoming vendor payments',
    subtitle: 'Due payments coming up in the next 7 days.',
    vendors: list,
  });

  return { sent: Boolean(result?.delivered), count: list.length };
}

const checkAndReleaseVendorPayments = async () => {
  try {
    const now = new Date();
    
    // Find vendors with scheduled payments that are due for release
    const vendorsToRelease = await prisma.vendor.findMany({
      where: {
        status: 'Scheduled',
        releaseDate: {
          lte: now
        },
        // Ensure we have bank details
        accountNumber: { not: null },
        bankCode: { not: null }
      },
      select: {
        id: true,
        accountName: true,
        vendorEmail: true,
        accountNumber: true,
        bankCode: true,
        scheduledAmount: true,
        category: true,
        eventId: true,
        // Gift: { select: { userId: true } } // Not actually used in the loop?
      }
    });

    console.log(`Found ${vendorsToRelease.length} vendor payments to release.`);

    let releasedCount = 0;

    for (const vendor of vendorsToRelease) {
      try {
        console.log(`Processing release for vendor ${vendor.id}...`);

        // 1. Create Transfer Recipient
        // We need a name for the recipient. Use accountName or vendorEmail or "Vendor"
        const recipientName = vendor.accountName || vendor.vendorEmail || `Vendor ${vendor.id}`;
        
        const recipientRes = await createTransferRecipient({
          name: recipientName,
          account_number: vendor.accountNumber,
          account_bank: vendor.bankCode
        });

        if (!recipientRes.status || !recipientRes.data?.recipient_code) {
          console.error(`Failed to create recipient for vendor ${vendor.id}:`, recipientRes.message);
          continue;
        }

        const recipientCode = recipientRes.data.recipient_code;

        // 2. Initiate Transfer
        // The amount stored in scheduledAmount is in NGN (Decimal). Paystack expects kobo if passed to initiateTransfer?
        // Let's check initiateTransfer implementation in paystack.js.
        // It does: amount: payload.amount * 100
        // So we should pass the amount in NGN.
        
        const amountToRelease = parseFloat(vendor.scheduledAmount);

        if (amountToRelease <= 0) {
          console.log(`Skipping vendor ${vendor.id} with 0 scheduled amount.`);
          continue;
        }

        const transferRes = await initiateTransfer({
          amount: amountToRelease,
          recipient_code: recipientCode,
          narration: `Payment release for ${vendor.category} (Event: ${vendor.eventId})`
        });

        if (transferRes.status) {
          // Success! Update vendor record
          // Move scheduledAmount to amountPaid
          await prisma.vendor.update({
            where: { id: vendor.id },
            data: {
              status: 'Released', // Or 'Paid' if full amount? 
              // The logic in vendors.js calculates balance = amountAgreed - amountPaid - scheduledAmount.
              // If we move scheduled to paid:
              amountPaid: { increment: vendor.scheduledAmount },
              scheduledAmount: 0,
              // releaseDate: null // We keep the release date as a record of when it was released
            }
          });
          
          console.log(`Successfully released payment for vendor ${vendor.id}`);
          releasedCount++;
        } else {
          console.error(`Failed to initiate transfer for vendor ${vendor.id}:`, transferRes.message);
        }

      } catch (err) {
        console.error(`Error processing vendor ${vendor.id}:`, err);
      }
    }

    return releasedCount;

  } catch (err) {
    console.error('Error checking vendor payments:', err);
    throw err;
  }
};

module.exports = { checkAndReleaseVendorPayments, checkAndSendVendorDuePaymentReminders, sendVendorPaymentDigestEmail, triggerVendorDuePaymentReminderEmail };
