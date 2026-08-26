import { eachDayOfInterval, format } from "date-fns";
import { MarkedDateProps, DayProps } from ".";
import { FixarTheme } from "../../global/styles/theme";
import { getPlatformDate } from "../../utils/getPlatformDate";

export const generateInterval = (start: DayProps, end: DayProps, colors: FixarTheme["colors"]) => {
  let interval: MarkedDateProps = {};
  eachDayOfInterval({
    start: new Date(start.timestamp),
    end: new Date(end.timestamp),
  }).forEach((item) => {
    const date = format(getPlatformDate(item), "yyyy-MM-dd");
    interval = {
      ...interval,
      [date]: {
        color:
          start.dateString === date || end.dateString === date
            ? colors.primary
            : colors.secondary,
        textColor:
          start.dateString === date || end.dateString === date
            ? colors.primaryForeground
            : colors.secondaryForeground,
      },
    };
  });
  return interval;
};
