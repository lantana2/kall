import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Показывать уведомления даже когда приложение открыто.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SCHEDULE = [
  { hour: 9, minute: 0, title: 'Доброе утро! 🍳', body: 'Не забудь записать завтрак.' },
  { hour: 13, minute: 30, title: 'Время обеда 🍲', body: 'Сфоткай обед и посчитай калории.' },
  { hour: 19, minute: 30, title: 'Как прошёл день? 🌙', body: 'Запиши ужин и проверь норму.' },
];

// Запросить разрешение и поставить 3 ежедневных напоминания.
export async function setupNotifications() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Напоминания',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Пересоздаём расписание заново (чтобы не плодить дубли).
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const s of SCHEDULE) {
      await Notifications.scheduleNotificationAsync({
        content: { title: s.title, body: s.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: s.hour,
          minute: s.minute,
          channelId: 'reminders',
        },
      });
    }
    return true;
  } catch (e) {
    return false;
  }
}
