const prisma = require('../prismaClient');
const { initiateTransfer, createTransferRecipient } = require('./paystack');

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
      include: {
        Gift: {
          select: { userId: true }
        }
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

module.exports = { checkAndReleaseVendorPayments };
