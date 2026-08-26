import { addDays, isAfter, isBefore, parseISO, getTime } from "date-fns";
import { Platform } from "react-native";
import { Period } from "../types/data";

export const getPlatformDate = (date: Date) => {
  if (Platform.OS === "ios") {
    return addDays(date, 1);
  } else {
    return date;
  }
};

export const isBetween = (period: Period, date: string) => {
  const timestamp = getTime(parseISO(date));
  return isAfter(timestamp, period.start) && isBefore(timestamp, period.end);
};
