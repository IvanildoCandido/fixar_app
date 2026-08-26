import { SetStateAction, useState } from "react";
import { Modal } from "react-native";
import { Customer } from "../../../types/data";
import { SelectionCustomer } from "./SelectionCustomer";
import { Container, CustomerName, LabelCustomer } from "./styles";
import { ChevronDown } from "lucide-react-native";
import { useTheme } from "styled-components/native";

export interface SelectProps {
  selected: Customer;
  setSelected: React.Dispatch<SetStateAction<Customer>>;
}

export const SelectCustomers = ({ selected, setSelected }: SelectProps) => {
  const [customerModal, setCustomerModal] = useState(false);
  const theme = useTheme();
  return (
    <>
      <LabelCustomer>Proprietário do equipamento *</LabelCustomer>
      <Container accessibilityRole="button" accessibilityLabel="Selecionar proprietário do equipamento" onPress={() => setCustomerModal(true)}>
        <CustomerName numberOfLines={1}>{selected.name || "Selecione um cliente"}</CustomerName>
        <ChevronDown size={18} color={theme.colors.muted} />
        <Modal visible={customerModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setCustomerModal(false)}>
          <SelectionCustomer
            closeModal={setCustomerModal}
            setCustomer={setSelected}
          />
        </Modal>
      </Container>
    </>
  );
};
