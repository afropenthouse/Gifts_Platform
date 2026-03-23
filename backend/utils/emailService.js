const { sendEmail, mailFrom } = require('./email');
const { generateCalendarLinks } = require('./calendarLinks');

const emailEnabled = Boolean(process.env.POSTMARK_SERVER_TOKEN);

if (!emailEnabled) {
  console.warn('📧 Email Service disabled: POSTMARK_SERVER_TOKEN not set in .env');
}

const sendRequired = async (mailOptions) => {
  const result = await sendEmail(mailOptions);
  if (result?.delivered) return result;
  const err = result?.error;
  const msg =
    typeof err === 'string'
      ? err
      : err?.Message || err?.message || (err ? JSON.stringify(err) : 'Email delivery failed');
  throw new Error(msg);
};

const formatEventHeading = (gift) => {
  if (!gift) return 'Event Celebration';
  if (gift.type === 'wedding' && gift.details?.groomName && gift.details?.brideName) {
    return `${gift.details.groomName} & ${gift.details.brideName}`;
  }
  return gift.title || 'Event Celebration';
};

const formatEventDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const sendRsvpEmail = async ({ recipient, guestName, attending, gift, eventUrl }) => {
  if (!emailEnabled) {
    console.warn('RSVP email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipient) {
    return { delivered: false, reason: 'No recipient provided' };
  }

  const heading = formatEventHeading(gift);
  const eventDate = formatEventDate(gift?.date);
  const eventAddress = gift?.details?.address;
  const accent = '#2E235C';
  const responseLine = attending
    ? `Thank you for letting us know you will attend. We cannot wait to celebrate with you${eventDate ? ` on <b>${eventDate}</b>` : ''}.`
    : 'Thank you for letting us know. If your plans change, reply to this email and we will update your RSVP.';
  const googleMapsUrl = eventAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventAddress)}` : null;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: bold; color: ${accent}; margin: 0 0 8px 0;">RSVP Confirmation</h1>
        <p style="margin: 0; color: #6b7280; font-size: 16px;">${heading}</p>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <p style="font-size: 16px; margin-bottom: 24px;">Hi ${guestName || 'there'},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          ${responseLine}
        </p>
        
        ${attending && eventAddress ? `
          <div style="margin-top: 24px;">
            <p style="margin: 0 0 4px 0; font-weight: 600;">Location</p>
            <a href="${googleMapsUrl}" style="color: ${accent}; text-decoration: none; border-bottom: 1px dotted ${accent};">${eventAddress}</a>
          </div>
        ` : ''}
      </div>

      ${attending ? `
      <div style="text-align: center; margin: 8px 0 24px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; font-weight: 600;">Next steps</p>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <a href="${eventUrl || '#'}" style="display: block; width: 200px; background-color: ${accent}; color: #ffffff; padding: 12px 0; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center;">
                Send a Cash Gift
              </a>
            </td>
          </tr>
          ${gift?.isSellingAsoebi ? `
          <tr>
            <td align="center">
              <a href="${eventUrl || '#'}" style="display: block; width: 200px; background-color: #D4AF37; color: #111827; padding: 12px 0; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center;">
                Buy Asoebi
              </a>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          If you need to update your response, just reply to this email.
        </p>
      </div>

    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipient,
      subject: `${heading} – RSVP Confirmation`,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send RSVP email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendOwnerNotificationEmail = async ({ ownerEmail, ownerName, guestName, guestEmail, attending, gift }) => {
  if (!emailEnabled) {
    return { delivered: false, skipped: true };
  }

  const heading = formatEventHeading(gift);
  const status = attending ? 'accepted' : 'declined';
  const statusColor = attending ? '#059669' : '#dc2626';
  const accent = '#2E235C';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: bold; color: ${accent}; margin: 0 0 8px 0;">New RSVP Response</h1>
        <p style="margin: 0; color: #6b7280; font-size: 16px;">${heading}</p>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <p style="font-size: 16px; margin-bottom: 24px;">
          Hi ${ownerName},
        </p>
        <p style="font-size: 18px; margin-bottom: 8px;">
          <strong>${guestName}</strong> has just <strong>${status}</strong> your invitation.
        </p>
        ${guestEmail ? `<p style="color: #6b7280; font-size: 14px; margin: 0;">Guest Email: <a href="mailto:${guestEmail}" style="color: ${accent}; text-decoration: none;">${guestEmail}</a></p>` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: ${accent}; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View Guest List
        </a>
      </div>

      <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Sent via BeThere
        </p>
      </div>

    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: ownerEmail,
      subject: `New RSVP: ${guestName} ${status}`,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send owner notification:', error);
    return { delivered: false, error: error.message };
  }
};

const sendReminderEmail = async ({ recipient, guestName, gift, eventUrl }) => {
  if (!emailEnabled) {
    console.warn('Reminder email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipient) {
    return { delivered: false, reason: 'No recipient provided' };
  }

  const heading = formatEventHeading(gift);
  const eventDate = formatEventDate(gift?.date);
  const eventAddress = gift?.details?.address;
  const accent = '#2E235C';
  const muted = '#f6f4ff';
  const eventPicture = gift?.picture || 'https://placehold.co/600x400?text=Event+Image';
  const calendarUrl = eventUrl ? `${eventUrl}/calendar` : '#';
  const directionsUrl = eventAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventAddress)}` : '#';
  const websiteUrl = eventUrl || '#';
  const cal = generateCalendarLinks(gift);

  let subject = `${heading} – Save the Date`;
  
  if (gift?.date) {
    const eventDateObj = new Date(gift.date);
    const now = new Date();
    const diffTime = eventDateObj - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { delivered: false, skipped: true, reason: 'Event is today, reminder not sent' };
    }
    
    if (diffDays > 0 && diffDays <= 30) {
      if (diffDays === 1) {
        subject = `Tomorrow is the Day! - ${heading}`;
      } else {
        subject = `${diffDays} Days to Go! - ${heading}`;
      }
    }
  }

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46,35,92,0.08); overflow: hidden;">
        <div style="padding: 24px 24px 0; text-align: center;">
          <div style="font-size: 22px; font-weight: 700; color: ${accent}; margin-bottom: 8px;">${heading}</div>
          <p style="margin: 0; font-size: 15px; color: #4b5563;">Save the Date</p>
        </div>

        <div style="padding: 20px;">
          
          <div style="text-align: center; margin-bottom: 24px;">
             <div style="color: ${accent}; font-weight: 700; font-size: 18px; margin-bottom: 4px;">${eventDate || 'Date TBA'}</div>
             ${eventAddress ? `<div style="color: #6b7280; font-size: 14px; max-width: 300px; margin: 0 auto;">${eventAddress}</div>` : ''}
          </div>

          <div style="background: ${muted}; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #374151;">Hi ${guestName},</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
              We're so excited to see you on our big day.
            </p>
            <p style="margin: 12px 0 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
              Click the button to send a cash gift and to get direction
            </p>
          </div>

          <div style="display: grid; gap: 10px;">
            <a href="${websiteUrl}" style="display: block; background: ${accent}; color: #fff; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; text-align: center;">
              Send Cash Gift
            </a>
            ${cal ? `
            <div style="height: 10px;"></div>
            <a href="${cal.google}" style="display: block; background: #fff; border: 1px solid #e5e7eb; color: #374151; text-decoration: none; padding: 10px; border-radius: 10px; font-weight: 600; font-size: 13px; text-align: center;">
              Add to Calendar
            </a>
            ` : ''}
            <div style="height: 10px;"></div>
            <a href="${directionsUrl}" style="display: block; background: #fff; border: 1px solid #e5e7eb; color: #374151; text-decoration: none; padding: 10px; border-radius: 10px; font-weight: 600; font-size: 13px; text-align: center;">
              Get Directions
            </a>
          </div>
        </div>

        <div style="background: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            Can't make it anymore? <a href="${websiteUrl}" style="color: ${accent}; text-decoration: underline;">Update your RSVP</a>
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipient,
      subject,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send reminder email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendRsvpCancellationEmail = async ({ recipient, guestName, gift }) => {
  if (!emailEnabled) {
    console.warn('RSVP cancellation email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }
  if (!recipient) return { delivered: false, reason: 'No recipient provided' };
  
  const heading = formatEventHeading(gift);
  const eventDate = formatEventDate(gift?.date);
  const accent = '#2E235C';
  const muted = '#f6f4ff';

  let subject = `${heading} – Save the Date`;
  
  if (gift?.date) {
    const eventDateObj = new Date(gift.date);
    const now = new Date();
    // Calculate difference in days (approximate)
    const diffTime = eventDateObj - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= 30) {
      if (diffDays === 1) {
         subject = `1 Day to Go! - ${heading}`;
      } else {
         subject = `${diffDays} Days to Go! - ${heading}`;
      }
    } else if (diffDays === 0) {
       subject = `Today is the Day! - ${heading}`;
    }
  }

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        <div style="padding: 28px 28px 18px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">Event Cancelled</h2>
          <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">${heading}</p>
          ${eventDate ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Date: ${eventDate}</p>` : ''}
        </div>
        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${guestName || 'there'},</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">We regret to inform you that this event has been cancelled. Thank you for your RSVP and understanding.</p>
          </div>
          <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">If you have any questions, please reply to this email.</p>
        </div>
      </div>
    </div>
  `;
  
  try {
    await sendRequired({
      from: mailFrom,
      to: recipient,
      subject: `${heading} – Event Cancelled`,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send RSVP cancellation email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendPostEventEmail = async ({ recipient, guestName, gift, eventUrl }) => {
  if (!emailEnabled) {
    console.warn('Post-event email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipient) {
    return { delivered: false, reason: 'No recipient provided' };
  }

  const heading = formatEventHeading(gift);
  const accent = '#2E235C';
  const muted = '#f6f4ff';
  
  // Always use production URL for post-event emails as requested
  const baseUrl = 'https://www.bethere.com';
  const qrCodeUrl = gift?.shareLink ? `${baseUrl}/qr-gift/${gift.shareLink}` : '#';

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        
        <div style="padding: 28px 28px 18px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">Thanks for Coming!</h2>
          <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">${heading}</p>
        </div>

        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${guestName || 'there'},</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
              Thank you so much for celebrating with us. Your presence made our day even more special.
            </p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
              We hope you had a wonderful time!
            </p>
          </div>
          
          <div style="margin-top: 24px;">
             <p style="margin: 0 0 12px; font-size: 14px; color: #4b5563;">If you took photos, share it here</p>
             <a href="${qrCodeUrl}" style="display: inline-block; background-color: ${accent}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
               Share Photos
             </a>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipient,
      subject: `Thanks for Coming! - ${heading}`,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send post-event email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendContributorThankYouEmail = async ({ recipientEmail, contributorName, amount, gift, isAsoebi }) => {
  if (!emailEnabled) {
    console.warn('Contributor thank you email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipientEmail) {
    return { delivered: false, reason: 'No recipient email provided' };
  }

  const heading = formatEventHeading(gift);
  const eventDate = formatEventDate(gift?.date);
  const accent = '#2E235C';
  const muted = '#f6f4ff';
  const cleanName = (contributorName || 'there').trim();
  
  const subject = isAsoebi 
    ? `Thank you for your Asoebi purchase for ${heading}` 
    : `Thank you for your gift to ${heading}`;

  const title = isAsoebi ? 'Thank You for Your Purchase' : 'Thank You!';
  
  const messageBody = isAsoebi
    ? `Thank you for purchasing Asoebi for <strong>${heading}</strong>. We have received your payment of <strong>₦${amount.toLocaleString()}</strong>.`
    : `Thank you for your generous gift of <strong>₦${amount.toLocaleString()}</strong>. Your kindness means so much to us.`;

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        <div style="padding: 28px 28px 18px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">${title}</h2>
          <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">Event: ${heading}</p>
          ${eventDate ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Date: ${eventDate}</p>` : ''}
        </div>

        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${cleanName},</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
              ${messageBody}
            </p>
          </div>

          <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">We appreciate your support!</p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipientEmail,
      subject,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send contributor thank you email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendGiftReceivedEmail = async ({ recipientEmail, recipientName, contributorName, amount, gift, message, isAsoebi }) => {
  if (!emailEnabled) {
    console.warn('Gift received email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipientEmail) {
    return { delivered: false, reason: 'No recipient email provided' };
  }

  const heading = formatEventHeading(gift);
  const eventDate = formatEventDate(gift?.date);
  const accent = '#2E235C';
  const muted = '#f6f4ff';
  const cleanRecipientName = (recipientName || 'there').trim();
  const isAnonymous = contributorName === 'Anonymous';
  const senderDisplay = isAnonymous ? 'An anonymous guest' : contributorName.trim();
  
  const subject = amount === 0 
    ? `You've received a new well wish message for  ${heading}`
    : isAsoebi 
      ? `New Asoebi Payment for ${heading}` 
      : `You received a gift for ${heading}!`;
    
  const title = amount === 0 
    ? 'New Message'
    : isAsoebi 
      ? 'New Asoebi Payment' 
      : 'You Received a Gift!';
  
  const messageBody = amount === 0
    ? `Someone has sent you a message to celebrate this special moment with you.<br><br>Tap the button below to read the message and see all the well wishes from your friends, family, and colleagues.`
    : isAsoebi
      ? `${senderDisplay} has paid for Asoebi (<strong>₦${amount.toLocaleString()}</strong>).`
      : `${senderDisplay} has sent you a cash gift of <strong>₦${amount.toLocaleString()}</strong>.`;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const actionButton = amount === 0 
    ? `<a href="${frontendUrl}/wishes/${gift.shareLink}" style="display: inline-block; background: ${accent}; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px;">View Well Wishes</a>`
    : `<a href="${frontendUrl}/dashboard" style="color: ${accent}; text-decoration: none; font-weight: 600; font-size: 12px;">View your Payment in your dashboard</a>`;

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        <div style="padding: 28px 28px 18px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">${title}</h2>
          <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">${heading}</p>
          ${eventDate ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Date: ${eventDate}</p>` : ''}
        </div>

        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${cleanRecipientName},</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
              ${messageBody}
            </p>
            ${amount === 0 ? '' : (message && !isAnonymous ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563; font-style: italic; line-height: 20px;">"${message}"</p>` : '')}
          </div>

          <div style="margin-top: 12px;">
            ${actionButton}
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipientEmail,
      subject,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send gift received email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendWithdrawalOtpEmail = async ({ recipientEmail, recipientName, otp }) => {
  if (!emailEnabled) {
    console.warn('Withdrawal OTP email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipientEmail) {
    return { delivered: false, reason: 'No recipient email provided' };
  }

  const accent = '#2E235C';
  const muted = '#f6f4ff';
  const cleanRecipientName = (recipientName || 'there').trim();
  
  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        <div style="padding: 28px 28px 18px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">Security Verification</h2>
          <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">Withdrawal OTP</p>
        </div>

        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${cleanRecipientName},</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
              You requested to withdraw funds from your BeThere wallet. Please use the following One-Time Password (OTP) to verify your request:
            </p>
            <div style="margin: 24px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${accent}; background: #ffffff; padding: 16px; border-radius: 8px; border: 1px dashed ${accent};">
              ${otp}
            </div>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              This code will expire in 10 minutes. If you did not request this withdrawal, please secure your account immediately.
            </p>
          </div>

          <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">
            Sent via BeThere Security
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipientEmail,
      subject: 'Withdrawal Verification Code',
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send withdrawal OTP email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const applyVariables = (input, vars) => {
  const source = String(input ?? '');
  return source.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const v = vars && Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : undefined;
    if (v === undefined || v === null) return match;
    return String(v);
  });
};

const isValidLink = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const formatBodyToHtml = (raw) => {
  const text = String(raw ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const lines = text.split('\n');
  const blocks = [];
  let buffer = [];

  const flushParagraph = () => {
    const paragraphText = buffer.join('\n').trim();
    buffer = [];
    if (!paragraphText) return;
    blocks.push({ type: 'p', text: paragraphText });
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    buffer.push(line);
  }
  flushParagraph();

  const htmlBlocks = [];

  for (const block of blocks) {
    const t = block.text;
    const bulletLines = t
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const allBullets = bulletLines.length > 0 && bulletLines.every((l) => l.startsWith('- ') || l.startsWith('• '));
    if (allBullets) {
      const items = bulletLines
        .map((l) => l.replace(/^(-\s+|•\s+)/, '').trim())
        .filter(Boolean)
        .map((item) => `<li style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${escapeHtml(item)}</li>`)
        .join('');
      htmlBlocks.push(`<ul style="margin: 12px auto 0; padding-left: 18px; max-width: 420px; text-align: left;">${items}</ul>`);
    } else {
      const safe = escapeHtml(t).replace(/\n/g, '<br/>');
      htmlBlocks.push(`<p style="margin: 12px 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${safe}</p>`);
    }
  }

  return htmlBlocks.join('');
};

const renderSleekTemplateEmail = ({ template, vars, accent = '#2E235C' }) => {
  const muted = '#f6f4ff';
  const heading = escapeHtml(applyVariables(template?.heading, vars) || '');
  const preheader = escapeHtml(applyVariables(template?.preheader, vars) || '');
  const greetingText = escapeHtml(applyVariables(template?.greeting, vars) || '');
  const bodyHtml = formatBodyToHtml(applyVariables(template?.body, vars) || '');

  const ctaLabel = escapeHtml(applyVariables(template?.ctaLabel, vars) || '');
  const ctaUrlRaw = applyVariables(template?.ctaUrl, vars) || '';
  const ctaUrl = isValidLink(ctaUrlRaw) ? ctaUrlRaw : '';

  const footerText = escapeHtml(applyVariables(template?.footer, vars) || '');
  const year = new Date().getFullYear();

  const preheaderSpan = preheader
    ? `<span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>`
    : '';

  const greetingHtml = greetingText
    ? `<p style="margin: 0; font-size: 16px; color: #111827; font-weight: 600;">${greetingText}</p>`
    : '';

  const ctaHtml = ctaLabel && ctaUrl
    ? `
      <div style="margin-top: 28px;">
        <a href="${ctaUrl}" style="display: inline-block; background-color: ${accent}; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(46,35,92,0.2);">
          ${ctaLabel}
        </a>
      </div>
    `
    : '';

  const footerLines = [
    footerText ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #9ca3af;">${footerText}</p>` : '',
    `<p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${year} BeThere. All rights reserved.</p>`,
  ].filter(Boolean).join('');

  return `
    ${preheaderSpan}
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        <div style="padding: 28px 28px 18px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">${heading}</h2>
        </div>

        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 20px;">
            ${greetingHtml}
            ${bodyHtml}
            ${ctaHtml}
          </div>
        </div>

        <div style="background: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6;">
          ${footerLines}
        </div>
      </div>
    </div>
  `;
};

const sendTemplatedEmail = async ({ recipientEmail, template, vars = {} }) => {
  if (!emailEnabled) {
    console.warn('Templated email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipientEmail) {
    return { delivered: false, reason: 'No recipient email provided' };
  }

  const subjectText = applyVariables(template?.subject, vars) || '';
  const subject = subjectText.trim() ? subjectText.trim() : 'BeThere';

  const html = renderSleekTemplateEmail({
    template,
    vars,
  });

  try {
    await sendRequired({
      from: mailFrom,
      to: recipientEmail,
      subject,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send templated email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendWelcomeEmail = async ({ recipientEmail, recipientName }) => {
  if (!emailEnabled) {
    console.warn('Welcome email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipientEmail) {
    return { delivered: false, reason: 'No recipient email provided' };
  }

  const accent = '#2E235C';
  const muted = '#f6f4ff';
  const cleanRecipientName = (recipientName || 'there').trim();
   const dashboardUrl = 'https://bethereexperience.com/dashboard';
   
   const html = `
     <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
       <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
         <div style="padding: 28px 28px 18px; text-align: center;">
           <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">Welcome to BeThere</h2>
           <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">We're excited to have you on board!</p>
         </div>

        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 20px;">
            <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 600;">Hi ${cleanRecipientName},</p>
            <p style="margin: 12px 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
              Thank you for signing up to BeThere! We're thrilled to help you celebrate your special moments.
            </p>
            <p style="margin-bottom: 8px; color: #111827;">BeThere Experience helps you to:</p>
  
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; text-align: left;">
    <tr>
      <td style="padding-bottom: 4px; vertical-align: top; width: 16px; color: #4b5563;">•</td>
      <td style="padding-bottom: 4px; color: #4b5563; font-size: 14px; line-height: 1.6;">Manage RSVPs</td>
    </tr>
    <tr>
      <td style="padding-bottom: 4px; vertical-align: top; width: 16px; color: #4b5563;">•</td>
      <td style="padding-bottom: 4px; color: #4b5563; font-size: 14px; line-height: 1.6;">Sell Asoebi</td>
    </tr>
    <tr>
      <td style="padding-bottom: 4px; vertical-align: top; width: 16px; color: #4b5563;">•</td>
      <td style="padding-bottom: 4px; color: #4b5563; font-size: 14px; line-height: 1.6;">Collect cash gifts all in one place.</td>
    </tr>
  </table>
            <p style="margin: 12px 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
              Ready to get started?
            </p>

            <div style="margin-top: 32px;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: ${accent}; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(46,35,92,0.2);">
              Create Event Link
            </a>
          </div>
          </div>

          

          <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
            If you have any questions, simply reply to this email. We're here to help!
          </p>
        </div>

        <div style="background: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} BeThere. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
     await sendRequired({
       from: mailFrom,
       to: recipientEmail,
       subject: 'Thank you for joining BeThere 🎉',
       html,
     });
     return { delivered: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendWalletOtpEmail = async ({ recipientEmail, recipientName, otp }) => {
  if (!emailEnabled) {
    console.warn('Wallet OTP email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipientEmail) {
    return { delivered: false, reason: 'No recipient email provided' };
  }

  const accent = '#2E235C';
  const muted = '#f6f4ff';
  const cleanRecipientName = (recipientName || 'there').trim();

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        <div style="padding: 28px 28px 18px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">Security Verification</h2>
          <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">Wallet Payment OTP</p>
        </div>

        <div style="padding: 0 24px 24px; text-align: center;">
          <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
            <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${cleanRecipientName},</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
              You are authorizing a wallet-funded scheduled payment. Please use the following One-Time Password (OTP) to confirm:
            </p>
            <div style="margin: 24px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${accent}; background: #ffffff; padding: 16px; border-radius: 8px; border: 1px dashed ${accent};">
              ${otp}
            </div>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              This code will expire in 10 minutes. If you did not request this, please secure your account immediately.
            </p>
          </div>

          <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">
            Sent via BeThere Security
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipientEmail,
      subject: 'Wallet Payment Verification Code',
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send wallet OTP email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendVendorPaymentReminderEmail = async ({ recipientEmail, recipientName, title, subtitle, vendors }) => {
  if (!emailEnabled) {
    console.warn('Vendor payment reminder email skipped: email configuration is missing');
    return { delivered: false, skipped: true };
  }

  if (!recipientEmail) {
    return { delivered: false, reason: 'No recipient email provided' };
  }

  const accent = '#2E235C';
  const muted = '#f6f4ff';
  const cleanRecipientName = (recipientName || 'there').trim();
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const rows = (vendors || []).map((v) => {
    const due = v?.dueDate ? new Date(v.dueDate) : null;
    const dueText = due ? due.toLocaleDateString() : '-';
    const amountAgreed = Number(v.amountAgreed || 0);
    const amountPaid = Number(v.amountPaid || 0);
    const scheduledAmount = Number(v.scheduledAmount || 0);
    const balance = Number(v.balance ?? (amountAgreed - amountPaid - scheduledAmount));

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #ebe9f7;">
          <div style="font-weight: 700; color: #111827; font-size: 13px;">${v.category || 'Vendor'}</div>
          <div style="font-size: 12px; color: #6b7280;">${v.eventTitle || 'Event'}</div>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #ebe9f7; text-align: right; font-size: 13px; color: #111827;">
          ₦${balance.toLocaleString()}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #ebe9f7; text-align: right; font-size: 13px; color: #111827;">
          ${dueText}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
        <div style="padding: 26px 26px 16px;">
          <div style="font-size: 20px; font-weight: 800; color: ${accent};">${title || 'Upcoming Vendor Payments'}</div>
          ${subtitle ? `<div style="margin-top: 6px; font-size: 13px; color: #4b5563;">${subtitle}</div>` : ''}
        </div>

        <div style="padding: 0 26px 18px;">
          <div style="background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
            <div style="font-size: 13px; color: #111827;">Hi ${cleanRecipientName},</div>
            <div style="margin-top: 6px; font-size: 13px; color: #4b5563; line-height: 20px;">
              Here are your vendor payments to take action on:
            </div>
          </div>
        </div>

        <div style="padding: 0 26px 10px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ebe9f7; border-radius: 12px; overflow: hidden;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px 12px; background: #fafafa; font-size: 12px; color: #6b7280; border-bottom: 1px solid #ebe9f7;">Vendor</th>
                <th style="text-align: right; padding: 10px 12px; background: #fafafa; font-size: 12px; color: #6b7280; border-bottom: 1px solid #ebe9f7;">Balance</th>
                <th style="text-align: right; padding: 10px 12px; background: #fafafa; font-size: 12px; color: #6b7280; border-bottom: 1px solid #ebe9f7;">Due</th>
              </tr>
            </thead>
            <tbody>
              ${rows || ''}
            </tbody>
          </table>
        </div>

        <div style="padding: 0 26px 24px;">
          <a href="${dashboardUrl}" style="display: inline-block; background-color: ${accent}; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px;">
            View in Dashboard
          </a>
        </div>

        <div style="padding: 14px 26px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
          Sent via BeThere
        </div>
      </div>
    </div>
  `;

  try {
    await sendRequired({
      from: mailFrom,
      to: recipientEmail,
      subject: title || 'Vendor Payment Reminder',
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send vendor payment reminder email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

module.exports = { 
  sendRsvpEmail, 
  sendOwnerNotificationEmail, 
  sendPostEventEmail,
  sendReminderEmail, 
  sendRsvpCancellationEmail,
  sendContributorThankYouEmail,
  sendGiftReceivedEmail,
  sendWithdrawalOtpEmail,
  sendWalletOtpEmail,
  sendVendorPaymentReminderEmail,
  sendTemplatedEmail,
  sendWelcomeEmail
};
