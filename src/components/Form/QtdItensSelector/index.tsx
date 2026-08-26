import { SetStateAction, useEffect, useState } from "react";
import { Modal } from "react-native";
import { SelectionItens } from "../ItensSelector/SelectionItens";
import {
  Container,
  ItemLabel,
  LabelArea,
  ActionButton,
  ItemName,
  QtdItem,
  ItensArea,
} from "./styles";
import { Plus } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { servicesTotal } from "../../../screens/Budgets";

export interface ItensProps {
  id: string;
  name: string;
  description?: string;
  price: string;
}

export interface SelectProps {
  itens: ItensProps[];
  setItens: React.Dispatch<SetStateAction<ItensProps[]>>;
  dataTable: string;
  selectorLabel: string;
  modalTitle: string;
  itensSelected: servicesTotal[];
  setItensSelected: React.Dispatch<SetStateAction<servicesTotal[]>>;
}

export const QtdItensSelector = ({
  itens,
  setItens,
  dataTable,
  selectorLabel,
  modalTitle,
  itensSelected,
  setItensSelected,
}: SelectProps) => {
  const theme = useTheme();
  const [itemModal, setItemModal] = useState(false);

  useEffect(() => {
    const data = itens.map((item) => ({
      id: item.id,
      name: item.name,
      qtd: 0,
      description: item.description,
      price: Number(item.price),
      total: 0,
    }));
    setItensSelected(data);
  }, [itens]);

  return (
    <>
      <LabelArea>
        <ItemLabel>{selectorLabel}</ItemLabel>
        <ActionButton onPress={() => setItemModal(true)}>
          <Plus size={18} color={theme.colors.primary} />
        </ActionButton>
      </LabelArea>
      <Container>
        {itensSelected.length > 0 &&
          itensSelected.map((item, index) => {
            return (
              <ItensArea key={index}>
                <QtdItem
                  keyboardType="numeric"
                  defaultValue={item.qtd.toString()}
                  onChangeText={(e) => {
                    const updatedItensSelected = [...itensSelected];
                    updatedItensSelected[index].qtd = Number(e);
                    updatedItensSelected[index].total =
                      Number(e) * updatedItensSelected[index].price;
                    setItensSelected(updatedItensSelected);
                  }}
                />
                <ItemName>{item.name}</ItemName>
                <ItemName>{Number(item.total)}</ItemName>
              </ItensArea>
            );
          })}
        <Modal visible={itemModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setItemModal(false)}>
          <SelectionItens
            closeModal={setItemModal}
            setItensSelected={setItens}
            itensSelected={itens}
            dataTable={dataTable}
            modalTitle={modalTitle}
          />
        </Modal>
      </Container>
    </>
  );
};
