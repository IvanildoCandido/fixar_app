import { SetStateAction } from "react";
import { Alert } from "react-native";
import API from "../../services/API";
import { Part } from "../../types/data";
import { Pencil, Trash2 } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import {
  Container,
  PartName,
  PartPrice,
  IconsArea,
  InfoArea,
  TouchAction,
} from "./styles";

interface Props {
  id: string;
  name: string;
  price: number;
  setParts: React.Dispatch<SetStateAction<Part[]>>;
  setPartsModal: React.Dispatch<SetStateAction<boolean>>;
  setDataEdit: React.Dispatch<SetStateAction<Part>>;
  setLoading: React.Dispatch<SetStateAction<boolean>>;
}
const datakey = "@fixar:parts";

export const PartItem = ({
  id,
  name,
  price,
  setParts,
  setPartsModal,
  setDataEdit,
  setLoading,
}: Props) => {
  const theme = useTheme();
  const getData = async () => {
    try {
      const { data } = await API.get("/parts/list");
      return data;
    } catch (error) {
      console.log(error);
    }
  };

  const handlerEdit = async (id: string) => {
    const data = await getData();
    setDataEdit(data.filter((item: Props) => item.id === id)[0]);
    setPartsModal(true);
  };

  const handlerDelete = async (id: string) => {
    Alert.alert(
      "Exclusão de Peças:",
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
              await API.delete(`/parts/${id}`);
              setLoading(true);
              setParts(await getData());
              setLoading(false);
            } catch (error) {
              console.log(error);
              Alert.alert(
                "Informação do Sistema",
                "Não foi possível carregar a lista de clientes."
              );
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
        <PartName>{name}</PartName>
        <PartPrice>{Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</PartPrice>
      </InfoArea>
      <IconsArea>
        <TouchAction accessibilityLabel="Editar peça" onPress={() => handlerEdit(id)}>
          <Pencil size={18} color={theme.colors.muted} />
        </TouchAction>
        <TouchAction accessibilityLabel="Excluir peça" onPress={() => handlerDelete(id)}>
          <Trash2 size={18} color={theme.colors.danger} />
        </TouchAction>
      </IconsArea>
    </Container>
  );
};
