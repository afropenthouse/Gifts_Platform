/**
 * Utility to generate universal calendar links (Google, Outlook, Office 365, Yahoo, and ICS)
 * This allows guests to add events to their calendars regardless of their device.
 */

const generateCalendarLinks = (gift) => {
  if (!gift || !gift.date) return null;

  const title = encodeURIComponent(gift.title || 'Event');
  const description = encodeURIComponent(gift.description || `Join us for ${gift.title}`);
  const location = encodeURIComponent(gift.details?.address || '');
  
  // Format dates for calendar links (YYYYMMDDTHHMMSSZ)
  const startDate = new Date(gift.date);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default to 2 hours duration
  
  const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // 1. Google Calendar
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${description}&location=${location}`;

  // 2. Outlook.com
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${startStr}&enddt=${endStr}&body=${description}&location=${location}`;

  // 3. Office 365
  const office365 = `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${startStr}&enddt=${endStr}&body=${description}&location=${location}`;

  // 4. Yahoo
  const yahoo = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startStr}&et=${endStr}&desc=${description}&in_loc=${location}`;

  // 5. ICS (Universal for Apple, Android, and Desktop Outlook)
  // Since we're sending an email, we'll provide a link to a route that downloads the ICS file
  const frontendUrl = process.env.FRONTEND_URL || 'https://bethereexperience.com';
  const ics = `${frontendUrl}/api/utils/calendar/ics/${gift.shareLink}`;

  return { google, outlook, office365, yahoo, ics };
};

module.exports = { generateCalendarLinks };
