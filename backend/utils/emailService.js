const nodemailer = require('nodemailer');

const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465', 10);
const smtpSecure = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === 'true'
  : process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : true;
const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;
const emailEnabled = Boolean(smtpUser && smtpPass);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

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
  if (!emailEnabled || !transporter) {
    console.warn('RSVP email skipped: SMTP configuration is missing');
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
                Get Asoebi
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
    await transporter.sendMail({
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
  if (!emailEnabled || !transporter) {
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
    await transporter.sendMail({
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
  if (!emailEnabled || !transporter) {
    console.warn('Reminder email skipped: SMTP configuration is missing');
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

  const html = `
    <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46,35,92,0.08); overflow: hidden;">
        <div style="padding: 24px 24px 0; text-align: center;">
          <div style="font-size: 22px; font-weight: 700; color: ${accent}; margin-bottom: 8px;">${heading}</div>
          <p style="margin: 0; font-size: 15px; color: #4b5563;">is coming up soon!</p>
        </div>

        <div style="padding: 20px;">
          <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
             ${eventPicture ? `<img src="${eventPicture}" alt="Event" style="width: 100%; height: 200px; object-fit: cover; display: block;">` : ''}
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding: 20px 16px 12px;">
              <div style="color: #fff; font-weight: 700; font-size: 18px;">${eventDate || 'Date TBA'}</div>
              ${eventAddress ? `<div style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px;">${eventAddress}</div>` : ''}
            </div>
          </div>

          <div style="background: ${muted}; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #374151;">Hi ${guestName},</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
              We're so excited to see you! Here are the details for the big day.
            </p>
          </div>

          <div style="display: grid; gap: 10px;">
            <a href="${websiteUrl}" style="display: block; background: ${accent}; color: #fff; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; text-align: center;">
              View Event Details
            </a>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <a href="${directionsUrl}" style="display: block; background: #fff; border: 1px solid #e5e7eb; color: #374151; text-decoration: none; padding: 10px; border-radius: 10px; font-weight: 600; font-size: 13px; text-align: center;">
                Get Directions
              </a>
              
            </div>
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
    await transporter.sendMail({
      from: mailFrom,
      to: recipient,
      subject: `${heading} – Event Reminder`,
      html,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Failed to send reminder email:', error?.message || error);
    return { delivered: false, error: error?.message || 'Unknown error' };
  }
};

const sendRsvpCancellationEmail = async ({ recipient, guestName, gift }) => {
  if (!emailEnabled || !transporter) {
    console.warn('RSVP cancellation email skipped: SMTP configuration is missing');
    return { delivered: false, skipped: true };
  }
  if (!recipient) return { delivered: false, reason: 'No recipient provided' };
  
  const heading = formatEventHeading(gift);
  const eventDate = formatEventDate(gift?.date);
  const accent = '#2E235C';
  const muted = '#f6f4ff';
  
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
    await transporter.sendMail({
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

const sendContributorThankYouEmail = async ({ recipientEmail, contributorName, amount, gift, isAsoebi }) => {
  if (!emailEnabled || !transporter) {
    console.warn('Contributor thank you email skipped: SMTP configuration is missing');
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

  const title = isAsoebi ? 'Thank You for Your Purchase' : 'Thank You for Your Gift';
  
  const messageBody = isAsoebi
    ? `Thank you for purchasing Asoebi for <strong>${heading}</strong>. We have received your payment of <strong>₦${amount.toLocaleString()}</strong>.`
    : `Thank you for your generous gift of <strong>₦${amount.toLocaleString()}</strong>. Your kindness means so much to us.`;

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
    await transporter.sendMail({
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
  if (!emailEnabled || !transporter) {
    console.warn('Gift received email skipped: SMTP configuration is missing');
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
  
  const subject = isAsoebi 
    ? `New Asoebi Payment for ${heading}` 
    : `You received a gift for ${heading}!`;
    
  const title = isAsoebi ? 'New Asoebi Payment' : 'You Received a Gift!';
  
  const messageBody = isAsoebi
    ? `${senderDisplay} has paid for Asoebi (<strong>₦${amount.toLocaleString()}</strong>).`
    : `${senderDisplay} has sent you a cash gift of <strong>₦${amount.toLocaleString()}</strong>.`;

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
            ${message && !isAnonymous ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563; font-style: italic; line-height: 20px;">"${message}"</p>` : ''}
          </div>

          <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="color: ${accent}; text-decoration: none; font-weight: 600;">View your Payment in your dashboard</a>
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
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

module.exports = { 
  sendRsvpEmail, 
  sendOwnerNotificationEmail, 
  sendReminderEmail, 
  sendRsvpCancellationEmail,
  sendContributorThankYouEmail,
  sendGiftReceivedEmail
};
