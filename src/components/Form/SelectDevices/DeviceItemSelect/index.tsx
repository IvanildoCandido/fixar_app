import { SetStateAction } from "react";
import { Device } from "../../../../types/data";

import {
  Container,
  DeviceLocation,
  DeviceReference,
  InfoArea,
  Label,
  Title,
} from "./styles";

interface Props {
  device: Device;
  setDevice: React.Dispatch<SetStateAction<Device>>;
  closeModal: React.Dispatch<SetStateAction<boolean>>;
}

export const DeviceItemSelect = ({ device, setDevice, closeModal }: Props) => {
  const handlerSelect = () => {
    setDevice(device);
    closeModal(false);
  };

  return (
    <Container onPress={() => handlerSelect()}>
      <InfoArea>
        <Label>
          <Title>Referência:</Title>
          <DeviceReference>{device.reference}</DeviceReference>
        </Label>
        <Label>
          <Title>Ambiente:</Title>
          <DeviceLocation>{device.location}</DeviceLocation>
        </Label>
      </InfoArea>
    </Container>
  );
};
