import React, { SetStateAction, useEffect } from "react";
import {
  Calendar as CustomCalendar,
  LocaleConfig,
} from "react-native-calendars";
import { Button, FormModal } from "../../design-system";
import { useTheme } from "styled-components/native";
import { ptBR } from "./locales";
import { Period } from "../../types/data";
import { defaultPeriod } from "../../utils/dafaultValues";

LocaleConfig.locales["pt-br"] = ptBR;
LocaleConfig.defaultLocale = "pt-br";

export interface MarkedDateProps {
  [date: string]: {
    color: string;
    textColor: string;
    disabled?: boolean;
    disableTouchEvent?: boolean;
  };
}

export interface DayProps {
  dateString: string;
  day: number;
  month: number;
  yeat: number;
  timestamp: number;
}

interface Props {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  markedDates: MarkedDateProps;
  onDayPress: any;
  setSelectedPeriod: React.Dispatch<SetStateAction<Period>>;
  setMarkedDates: React.Dispatch<SetStateAction<MarkedDateProps>>;
}

export const Calendar = ({
  closeModal,
  markedDates,
  onDayPress,
  setSelectedPeriod,
  setMarkedDates,
}: Props) => {
  const theme = useTheme();
  const handleButtonCancel = () => {
    setSelectedPeriod(defaultPeriod);
    setMarkedDates({} as MarkedDateProps);
    closeModal(false);
  };
  return (
    <FormModal title="Selecionar período" description="Toque no primeiro e no último dia do intervalo." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Aplicar" onPress={() => closeModal(false)} /></>}>
        <CustomCalendar
          markingType="period"
          markedDates={markedDates}
          onDayPress={onDayPress}
          theme={{ calendarBackground: theme.colors.surface, dayTextColor: theme.colors.foreground, monthTextColor: theme.colors.foreground, textDisabledColor: theme.colors.muted, arrowColor: theme.colors.primary, todayTextColor: theme.colors.primary, textDayFontFamily: theme.fonts.regular, textMonthFontFamily: theme.fonts.semibold, textDayHeaderFontFamily: theme.fonts.medium }}
        />
    </FormModal>
  );
};
