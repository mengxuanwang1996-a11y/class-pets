import { PushNotifications } from '@capacitor/push-notifications';
import { Directory, Filesystem } from '@capacitor/filesystem';

export interface PushNotificationToken {
  token: string;
}

export async function requestPushPermission(): Promise<boolean> {
  const result = await PushNotifications.requestPermissions();
  return result.receive === 'granted';
}

export async function getPushToken(): Promise<string | null> {
  try {
    const token = await PushNotifications.getDeliveredNotifications();
    if (token && token.notifications && token.notifications.length > 0) {
      return token.notifications[0].id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function registerPushHandlers(
  onNotification: (notification: any) => void
): Promise<void> {
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onNotification(notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    onNotification(notification.actionTypeId);
  });
}

export async function removeAllPushListeners(): Promise<void> {
  try {
    await PushNotifications.removeAllListeners();
  } catch {
    // Ignore errors when removing listeners
  }
}

// Offline storage utilities
export async function saveOfflineData(key: string, data: any): Promise<void> {
  try {
    const jsonStr = JSON.stringify(data);
    await Filesystem.writeFile({
      path: key,
      data: jsonStr,
      directory: Directory.Documents,
      encoding: 'utf8',
    });
  } catch (err) {
    console.error('Failed to save offline data:', err);
  }
}

export async function loadOfflineData<T>(key: string): Promise<T | null> {
  try {
    const result = await Filesystem.readFile({
      path: key,
      directory: Directory.Documents,
      encoding: 'utf8',
    });
    return JSON.parse(result.data) as T;
  } catch {
    return null;
  }
}

export async function deleteOfflineData(key: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: key,
      directory: Directory.Documents,
    });
  } catch {
    // Ignore errors when deleting
  }
}