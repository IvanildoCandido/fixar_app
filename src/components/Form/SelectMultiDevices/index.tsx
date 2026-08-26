import { SetStateAction, useState } from "react";
import { Modal } from "react-native";
import { SelectionItens } from "./SelectionItens";
import {
  Container,
  CustomerName,
  ItemLabel,
  LabelArea,
  ActionButton,
} from "./styles";
import { Plus } from "lucide-react-native";
import { useTheme } from "styled-components/native";

export interface ItensProps {
  id: string;
  customerId: string;
  reference: string;
  model: string;
  brand: string;
  location: string;
}

export interface SelectProps {
  customerId: string;
  itens: ItensProps[];
  setItens: React.Dispatch<SetStateAction<ItensProps[]>>;
  dataTable: string;
  selectorLabel: string;
  modalTitle: string;
}

export const SelectMultiDevices = ({
  customerId,
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
        <ActionButton onPress={() => setItemModal(true)}>
          <Plus size={18} color={theme.colors.primary} />
        </ActionButton>
      </LabelArea>
      <Container>
        {itens.length > 0 &&
          itens.map((item, index) => (
            <CustomerName key={index}>&bull; {item.reference}</CustomerName>
          ))}

        <Modal visible={itemModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setItemModal(false)}>
          <SelectionItens
            customerId={customerId}
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
