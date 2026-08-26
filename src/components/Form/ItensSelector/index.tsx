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
  QuantityButton,
  QuantityControl,
  QuantityText,
  QuantityValue,
  SelectedRow,
} from "./styles";
import { Plus } from "lucide-react-native";
import { useTheme } from "styled-components/native";

export interface ItensProps {
  id: string;
  name: string;
  description?: string;
  price: string;
  quantity?: number;
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
  const changeQuantity = (id: string, delta: number) => setItens(itens.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Number(item.quantity ?? 1) + delta) } : item));
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
          itens.map((item) => (
            <SelectedRow key={item.id}><CustomerName>&bull; {item.name}</CustomerName><QuantityControl><QuantityButton accessibilityLabel={`Diminuir quantidade de ${item.name}`} onPress={() => changeQuantity(item.id, -1)}><QuantityText>−</QuantityText></QuantityButton><QuantityValue>{item.quantity ?? 1}</QuantityValue><QuantityButton accessibilityLabel={`Aumentar quantidade de ${item.name}`} onPress={() => changeQuantity(item.id, 1)}><QuantityText>+</QuantityText></QuantityButton></QuantityControl></SelectedRow>
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
