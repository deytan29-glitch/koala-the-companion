// ===== NOTIFICATION SYSTEM =====
// Push notifications (if supported) + in-app reminder fallback.
// "Don't break your streak", "Your koala misses you", "Close to goal"

import { state, save } from './state.js';
import { emojiSVG } from './emojiSVG.js';

let _reminderTimer = null;
let _notifPermission = 'default';

// Initialize notification system
export function initNotifications() {
  // Check browser push notification support
  if ('Notification' in window) {
    _notifPermission = Notification.permission;
  }

  // Start in-app reminder loop
  _startReminderLoop();
}

// Request push notification permission
export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve(false);
  return Notification.requestPermission().then(perm => {
    _notifPermission = perm;
    return perm === 'granted';
  });
}

// Send push notification (or fallback to in-app)
export function sendNotification(title, body, tag) {
  if (_notifPermission === 'granted' && !document.hasFocus()) {
    try {
      new Notification(title, { body, tag, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%239E9E9E"/></svg>' });
      return;
    } catch (e) { /* fall through to in-app */ }
  }
  // In-app fallback
  showInAppReminder(body);
}

// In-app reminder toast
export function showInAppReminder(message) {
  // Don't show if already showing one
  if (document.querySelector('.reminder-toast')) return;

  const toast = document.createElement('div');
  toast.className = 'reminder-toast';
  toast.innerHTML = `
    <span class="reminder-icon">${emojiSVG('koala',20)}</span>
    <span class="reminder-text">${message}</span>
    <button class="reminder-close" onclick="this.parentElement.remove()">\u{D7}</button>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

// Periodic reminder checks
function _startReminderLoop() {
  if (_reminderTimer) clearInterval(_reminderTimer);
  _reminderTimer = setInterval(_checkReminders, 60 * 1000); // check every minute
  // Also check on start
  setTimeout(_checkReminders, 5000);
}

function _checkReminders() {
  const now = new Date();
  const hour = now.getHours();
  const today = now.toDateString();
  const checkedIn = state.todayCheckedIn === today;

  // Don't nag too often: track last reminder time
  const lastReminder = state.lastReminderTimestamp || 0;
  const minsSinceReminder = (Date.now() - lastReminder) / (1000 * 60);
  if (minsSinceReminder < 90) return; // minimum 90 mins between reminders

  // === HUNGER REMINDERS (morning 8-10am and afternoon 2-4pm) ===
  const energy = state.energy || 0;
  const fedToday = state.lastFedDate === today ? (state.todayFeedCount || 0) : 0;
  const isHungry = energy < 50;

  if (isHungry && (hour >= 8 && hour < 10)) {
    const hasLeaves = (state.leaves || 0) > 0;
    sendNotification(
      '\u{1F428} Koala is Hungry!',
      hasLeaves
        ? 'Your koala is grumbling for eucalyptus! Time to feed them.'
        : 'Your koala is hungry but has no leaves! Buy some in the shop.',
      'hunger-morning'
    );
    state.lastReminderTimestamp = Date.now();
    save();
    return;
  }

  if (isHungry && (hour >= 14 && hour < 16)) {
    const hasLeaves = (state.leaves || 0) > 0;
    sendNotification(
      '\u{1F428} Koala is Still Hungry!',
      hasLeaves
        ? 'Your koala is really hungry now! Drag a leaf to feed them.'
        : 'Empty leaf stash! Head to the shop and stock up for your hungry koala.',
      'hunger-afternoon'
    );
    state.lastReminderTimestamp = Date.now();
    save();
    return;
  }

  // === STREAK REMINDER (evening, not checked in) ===
  if (hour >= 19 && hour < 22 && !checkedIn && (state.streak || 0) >= 2) {
    sendNotification(
      '\u{1F428} Koala Calm',
      `Don\u2019t break your ${state.streak}-day streak! Time to check in.`,
      'streak-reminder'
    );
    state.lastReminderTimestamp = Date.now();
    save();
    return;
  }

  // === MISS-YOU REMINDER (afternoon, inactive) ===
  if (hour >= 14 && hour < 17 && !checkedIn) {
    const lastActive = state.lastActiveTimestamp || 0;
    const hoursSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60);
    if (hoursSinceActive > 18) {
      sendNotification(
        '\u{1F428} Koala Calm',
        'Your koala misses you! Come say hi.',
        'miss-reminder'
      );
      state.lastReminderTimestamp = Date.now();
      save();
      return;
    }
  }
}

// Clean up
export function stopNotifications() {
  if (_reminderTimer) { clearInterval(_reminderTimer); _reminderTimer = null; }
}
