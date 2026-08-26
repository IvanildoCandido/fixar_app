import { SetStateAction } from "react";
import { Alert } from "react-native";
import API from "../../services/API";
import { Service } from "../../types/data";
import { Pencil, Trash2 } from "lucide-react-native";
import { useTheme } from "styled-components/native";

import {
  Container,
  ServiceName,
  ServicePrice,
  IconsArea,
  InfoArea,
  TouchAction,
} from "./styles";

interface Props {
  id: string;
  name: string;
  price: number;
  setServices: React.Dispatch<SetStateAction<Service[]>>;
  setServicesModal: React.Dispatch<SetStateAction<boolean>>;
  setDataEdit: React.Dispatch<SetStateAction<Service>>;
  setLoading: React.Dispatch<SetStateAction<boolean>>;
}

export const ServiceItem = ({
  id,
  name,
  price,
  setServices,
  setServicesModal,
  setDataEdit,
  setLoading,
}: Props) => {
  const theme = useTheme();
  const getData = async () => {
    try {
      const { data } = await API.get("/services/list");
      return data;
    } catch (error) {
      console.log(error);
    }
  };

  const handlerEdit = async (id: string) => {
    const data = await getData();
    setDataEdit(data.filter((item: Props) => item.id === id)[0]);
    setServicesModal(true);
  };

  const handlerDelete = async (id: string) => {
    Alert.alert(
      "Exclusão de Serviço:",
      "Você deseja apagar esse serviço? Esta ação é irreversível e pode afetar os relatórios anteriores!",
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
              await API.delete(`/services/${id}`);
              setLoading(true);
              setServices(await getData());
              setLoading(false);
            } catch (error) {
              console.log(error);
              alert("Não foi possível carregar a lista de serviços.");
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
        <ServiceName>{name}</ServiceName>
        <ServicePrice>{Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</ServicePrice>
      </InfoArea>
      <IconsArea>
        <TouchAction accessibilityLabel="Editar serviço" onPress={() => handlerEdit(id)}>
          <Pencil size={18} color={theme.colors.muted} />
        </TouchAction>
        <TouchAction accessibilityLabel="Excluir serviço" onPress={() => handlerDelete(id)}>
          <Trash2 size={18} color={theme.colors.danger} />
        </TouchAction>
      </IconsArea>
    </Container>
  );
};
