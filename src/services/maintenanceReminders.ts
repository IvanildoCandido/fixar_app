import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Device } from "../types/data";

const ANDROID_CHANNEL_ID = "maintenance-reminders";

export function calculateReminderDueDate(intervalDays: number, from = new Date()) {
  const dueDate = new Date(from);
  dueDate.setDate(dueDate.getDate() + intervalDays);
  return dueDate;
}

export async function scheduleMaintenanceReminder({
  device,
  dueDate,
  workOrderId,
}: {
  device: Device;
  dueDate: Date;
  workOrderId: string;
}) {
  if (Platform.OS === "web") return null;

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Permissão de notificações não concedida.");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Lembretes de manutenção",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Manutenção no prazo",
      body: `O equipamento ${device.reference}, de ${device.Customer.name}, está no prazo de manutenção.`,
      sound: "default",
      data: { workOrderId, deviceId: device.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueDate,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });
}

export async function cancelMaintenanceReminder(workOrderId: string) {
  if (Platform.OS === "web") return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter(
    (notification) => notification.content.data?.workOrderId === workOrderId
  );
  await Promise.all(
    matching.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

export async function cancelPreviousMaintenanceReminders(deviceId: string, currentWorkOrderId?: string) {
  if (Platform.OS === "web") return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((notification) =>
    notification.content.data?.deviceId === deviceId &&
    notification.content.data?.workOrderId !== currentWorkOrderId
  );
  await Promise.all(
    matching.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}
