import { format } from "date-fns";
import { SetStateAction, useEffect, useState } from "react";
import { Modal } from "react-native";
import { Period } from "../../../types/data";
import { getPlatformDate } from "../../../utils/getPlatformDate";
import { Calendar, DayProps, MarkedDateProps } from "../../Calendar";
import { generateInterval } from "../../Calendar/generateInterval";
import {
  Container,
  DeviceName,
  LabelDevice,
  ReferenceName,
} from "./styles";
import { CalendarDays } from "lucide-react-native";
import { useTheme } from "styled-components/native";

export interface SelectProps {
  customerId: string;
  selectedPeriod: Period;
  setSelectedPeriod: React.Dispatch<SetStateAction<Period>>;
}

export const SelectPeriod = ({
  selectedPeriod,
  setSelectedPeriod,
}: SelectProps) => {
  const theme = useTheme();
  const [periodModal, setPeriodModal] = useState(false);
  const [lastSelectedDate, setLastSelectedDate] = useState<DayProps>(
    {} as DayProps
  );
  const [markedDates, setMarkedDates] = useState<MarkedDateProps>(
    {} as MarkedDateProps
  );
  const handlerModalDevices = () => {
    setPeriodModal(true);
  };

  const handleChangeDate = (date: DayProps) => {
    let start = !lastSelectedDate.timestamp ? date : lastSelectedDate;
    let end = date;
    if (start.timestamp > end.timestamp) {
      start = end;
      end = start;
    }
    setLastSelectedDate(end);
    const interval = generateInterval(start, end, theme.colors);
    setMarkedDates(interval);

    const firstDate = Object.keys(interval)[0];
    const endDate = Object.keys(interval)[Object.keys(interval).length - 1];

    setSelectedPeriod({
      start: start.timestamp,
      end: end.timestamp,
      startFormatted: format(getPlatformDate(new Date(firstDate)), "dd/MM/yyy"),
      endFormatted: format(getPlatformDate(new Date(endDate)), "dd/MM/yyy"),
    });
  };

  return (
    <>
      <LabelDevice>Selecione um período:</LabelDevice>
      <Container onPress={() => handlerModalDevices()}>
        {selectedPeriod.start === 0 ? (
          <DeviceName>{selectedPeriod.startFormatted}</DeviceName>
        ) : (
          <DeviceName>{`${selectedPeriod.startFormatted} - ${selectedPeriod.endFormatted}`}</DeviceName>
        )}

        <CalendarDays size={18} color={theme.colors.muted} />
        <Modal visible={periodModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPeriodModal(false)}>
          <Calendar
            closeModal={setPeriodModal}
            markedDates={markedDates}
            onDayPress={handleChangeDate}
            setSelectedPeriod={setSelectedPeriod}
            setMarkedDates={setMarkedDates}
          />
        </Modal>
      </Container>
    </>
  );
};
