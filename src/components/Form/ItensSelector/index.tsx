import { SetStateAction, useState } from "react";
import { Modal } from "react-native";
import { SelectionItens } from "./SelectionItens";
import {
  Container,
  CustomerName,
  EmptyText,
  CountBadge,
  CountText,
  ItemLabel,
  LabelArea,
  ActionButton,
} from "./styles";
import { Plus } from "lucide-react-native";
import { useTheme } from "styled-components/native";

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
}

export const SelectItens = ({
  itens,
  setItens,
  dataTable,
  selectorLabel,
  modalTitle,
}: SelectProps) => {
  const theme = useTheme();
  const [itemModal, setItemModal] = useState(false);
  return (
    <>
      <LabelArea>
        <ItemLabel>{selectorLabel}</ItemLabel>
        {itens.length > 0 && <CountBadge><CountText>{itens.length}</CountText></CountBadge>}
        <ActionButton onPress={() => setItemModal(true)}>
          <Plus size={18} color={theme.colors.primary} />
        </ActionButton>
      </LabelArea>
      <Container>
        {itens.length === 0 && <EmptyText>Nenhum item selecionado</EmptyText>}
        {itens.length > 0 &&
          itens.map((item, index) => (
            <CustomerName key={index}>&bull; {item.name}</CustomerName>
          ))}

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
