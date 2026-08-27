import { SetStateAction, useEffect, useState } from "react";
import { Alert, Modal } from "react-native";
import { Device } from "../../../types/data";
import { SelectionDevice } from "./SelectionDevice/index";
import {
  Container,
  DeviceName,
  LabelDevice,
  ReferenceName,
} from "./styles";
import { ChevronDown } from "lucide-react-native";
import { useTheme } from "styled-components/native";


export interface SelectProps {
  customerId: string;
  selected: Device;
  setSelected: React.Dispatch<SetStateAction<Device>>;
}

export const SelectDevices = ({
  selected,
  setSelected,
  customerId,
}: SelectProps) => {
  const theme = useTheme();
  const [deviceModal, setDeviceModal] = useState(false);
  const handlerModalDevices = () => {
    if (customerId === "") {
      Alert.alert(
        "Dados Incompletos!",
        "Selecione um cliente antes de selecionar o equipamento!"
      );
      return;
    } else {
      setDeviceModal(true);
    }
  };
  return (
    <>
      <LabelDevice>Equipamento *</LabelDevice>
      <Container accessibilityRole="button" accessibilityLabel="Selecionar equipamento" onPress={() => handlerModalDevices()}>
        {selected.reference ? (
          <ReferenceName>{selected.reference}</ReferenceName>
        ) : (
          <DeviceName>{selected.location || (customerId ? "Selecione um equipamento" : "Selecione um cliente primeiro")}</DeviceName>
        )}

        <ChevronDown size={18} color={theme.colors.muted} />
        <Modal visible={deviceModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setDeviceModal(false)}>
          <SelectionDevice
            customerId={customerId}
            closeModal={setDeviceModal}
            setDevice={setSelected}
          />
        </Modal>
      </Container>
    </>
  );
};
