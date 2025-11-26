/**
 * Notification utilities for Vibepoint
 * Handles notification permissions and scheduling
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function checkNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function scheduleNotification(title: string, body: string, delayMs: number = 0) {
  const permission = await requestNotificationPermission();

  if (!permission) {
    console.log('Notification permission not granted');
    return;
  }

  if (delayMs > 0) {
    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'vibepoint-reminder',
        renotify: false,
      });
    }, delayMs);
  } else {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'vibepoint-reminder',
      renotify: false,
    });
  }
}

/**
 * Schedule daily check-in reminder
 * Note: This is a basic implementation. For production, use service workers
 * and the Notifications API with proper scheduling.
 */
export function scheduleDailyReminder(hour: number = 20, minute: number = 0) {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  scheduleNotification(
    'How are you feeling?',
    'Take a moment to check in with yourself 🌟',
    timeUntilNotification
  );

  // Store preference in localStorage
  localStorage.setItem('vibepoint_notifications_enabled', 'true');
  localStorage.setItem('vibepoint_reminder_time', `${hour}:${minute}`);
}

export function disableNotifications() {
  localStorage.setItem('vibepoint_notifications_enabled', 'false');
}

export function areNotificationsEnabled(): boolean {
  return localStorage.getItem('vibepoint_notifications_enabled') === 'true';
}
