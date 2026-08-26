import AsyncStorage from "@react-native-async-storage/async-storage";
import { SetStateAction, useState } from "react";
import { Alert } from "react-native";
import { setLocale } from "yup";
import { DeviceProps } from "../../screens/Devices";
import API from "../../services/API";
import { Customer, Device } from "../../types/data";
import { Pencil, Trash2 } from "lucide-react-native";
import { useTheme } from "styled-components/native";

import {
  Container,
  ReferenceName,
  IconsArea,
  InfoArea,
  TouchAction,
  LocationName,
  CustomerName,
  Label,
  Title,
} from "./styles";

interface Props {
  id: string;
  reference: string;
  location: string;
  Customer: Customer;
  setDevices: React.Dispatch<SetStateAction<DeviceProps[]>>;
  setDevicesModal: React.Dispatch<SetStateAction<boolean>>;
  setDataEdit: React.Dispatch<SetStateAction<Device>>;
  setLoading: React.Dispatch<SetStateAction<boolean>>;
}
const datakey = "@fixar:devices";

export const DeviceItem = ({
  id,
  reference,
  location,
  Customer,
  setDevices,
  setDevicesModal,
  setDataEdit,
  setLoading,
}: Props) => {
  const theme = useTheme();
  const getData = async () => {
    try {
      const { data } = await API.get("/devices/list");
      return data;
    } catch (error) {
      console.log(error);
    }
  };

  const handlerEdit = async (id: string) => {
    const data = await getData();
    setDataEdit(data.filter((item: Props) => item.id === id)[0]);
    setDevicesModal(true);
  };

  const handlerDelete = async (id: string) => {
    Alert.alert(
      "Exclusão de Equipamentos:",
      "Você deseja apagar esse item? Esta ação é irreversível e pode afetar os relatórios anteriores!",
      [
        {
          text: "Não",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            try {
              await API.delete(`/devices/${id}`);
              setLoading(true);
              setDevices(await getData());
              setLoading(false);
            } catch (error) {
              console.log(error);
              alert("Não foi possível carregar a lista de equipamentos.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };
  return (
    <Container>
      <InfoArea>
        <Label>
          <Title>Referência:</Title>
          <ReferenceName>{reference}</ReferenceName>
        </Label>
        <Label>
          <Title>Ambiente:</Title>
          <LocationName>{location}</LocationName>
        </Label>
        <Label>
          <Title>Cliente:</Title>
          <CustomerName>{Customer.name}</CustomerName>
        </Label>
      </InfoArea>
      <IconsArea>
        <TouchAction accessibilityLabel="Editar equipamento" onPress={() => handlerEdit(id)}>
          <Pencil size={18} color={theme.colors.muted} />
        </TouchAction>
        <TouchAction accessibilityLabel="Excluir equipamento" onPress={() => handlerDelete(id)}>
          <Trash2 size={18} color={theme.colors.danger} />
        </TouchAction>
      </IconsArea>
    </Container>
  );
};
