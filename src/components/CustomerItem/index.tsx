import { SetStateAction, useState } from "react";
import { Alert, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import API from "../../services/API";
import { Customer, CustomerDevices, Device } from "../../types/data";
import { Pencil, Snowflake, Trash2 } from "lucide-react-native";
import { useTheme } from "styled-components/native";

import {
  Container,
  CustomerName,
  CustomerPhone,
  IconsArea,
  InfoArea,
  TouchAction,
  StatsCaption,
  CountDevices,
  StatsArea,
} from "./styles";
import { SelectionDevice } from "../Form/SelectDevices/SelectionDevice/index";

interface Props {
  id: string;
  name: string;
  phone: string;
  devicesCount: string;
  setCustomers: React.Dispatch<SetStateAction<CustomerDevices[] | any>>;
  setCustomerModal: React.Dispatch<SetStateAction<boolean>>;
  setDataEdit: React.Dispatch<SetStateAction<Customer>>;
  setLoading: React.Dispatch<SetStateAction<boolean>>;
}

export const CustomerItem = ({
  id,
  name,
  phone,
  devicesCount,
  setCustomers,
  setCustomerModal,
  setDataEdit,
  setLoading,
}: Props) => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [deviceModal, setDeviceModal] = useState(false);

  const getData = async () => {
    try {
      const { data } = await API.get("/customers/list");
      return data;
    } catch (error) {
      console.log(error);
    }
  };

  const handlerListDevices = (id: string) => {
    setDeviceModal(true);
  };

  const handleDeviceSelect = (device: Device) => {
    navigation.navigate("Repair", {
      customer: device.Customer,
      device,
    });
  };

  const handlerEdit = async (id: string) => {
    const data = await getData();
    setDataEdit(data.filter((item: Props) => item.id === id)[0]);
    setCustomerModal(true);
  };

  const handlerDelete = async (id: string) => {
    Alert.alert(
      "Exclusão de Clientes:",
      "Você deseja apagar esse cliente? Esta ação é irreversível e pode afetar os relatórios desse cliente!",
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
              await API.delete(`/customers/${id}`);
              setLoading(true);
              setCustomers(await getData());
              setLoading(false);
            } catch (error) {
              console.log(error);
              alert("Não foi possível carregar a lista de clientes.");
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
        <CustomerName>
          {name.length > 25 ? name.slice(0, 25) + "..." : name}
        </CustomerName>
        <CustomerPhone>{phone}</CustomerPhone>
        <StatsArea>
          <StatsCaption>Equipamentos</StatsCaption><CountDevices>{devicesCount || "0"}</CountDevices>
        </StatsArea>
      </InfoArea>
      <IconsArea>
        <TouchAction accessibilityLabel="Ver equipamentos" onPress={() => handlerListDevices(id)}>
          <Snowflake size={18} color={theme.colors.muted} />
        </TouchAction>
        <TouchAction accessibilityLabel="Editar cliente" onPress={() => handlerEdit(id)}>
          <Pencil size={18} color={theme.colors.muted} />
        </TouchAction>
        <TouchAction accessibilityLabel="Excluir cliente" onPress={() => handlerDelete(id)}>
          <Trash2 size={18} color={theme.colors.danger} />
        </TouchAction>
      </IconsArea>
      <Modal visible={deviceModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setDeviceModal(false)}>
        <SelectionDevice
          customerId={id}
          closeModal={setDeviceModal}
          onSelect={handleDeviceSelect}
        />
      </Modal>
    </Container>
  );
};
