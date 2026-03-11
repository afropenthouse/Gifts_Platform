const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendWelcomeEmail } = require('../utils/emailService');

async function triggerWelcomeEmail() {
  const recipientEmail = "oluwaseunpaul98@gmail.com";
  const recipientName = "Oluwaseun";

  console.log(`🚀 Triggering welcome email to: ${recipientEmail}...`);

  try {
    const result = await sendWelcomeEmail({
      recipientEmail,
      recipientName
    });

    if (result.delivered) {
      console.log(`✅ Welcome email sent successfully to ${recipientEmail}!`);
    } else {
      console.error(`❌ Failed to send welcome email:`, result.error || result.reason || 'Unknown error');
      if (result.skipped) {
        console.warn('⚠️  Email sending was skipped (check SMTP config)');
      }
    }
  } catch (error) {
    console.error('💥 Unexpected error while triggering email:', error);
  }
}

triggerWelcomeEmail();
