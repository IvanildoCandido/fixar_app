import { SetStateAction } from "react";
import { Customer } from "../../../../types/data";

import { ChevronRight } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { Container, CustomerName, CustomerMeta, InfoArea, Initials } from "./styles";

interface Props {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  document: string;
  setCustomer: React.Dispatch<SetStateAction<Customer>>;
  closeModal: React.Dispatch<SetStateAction<boolean>>;
}

export const CustomerItemSelect = ({
  id,
  name,
  address,
  email,
  phone,
  document,
  setCustomer,
  closeModal,
}: Props) => {
  const theme = useTheme();
  const handlerSelect = () => {
    setCustomer({ id, name, address, email, phone, document });
    closeModal(false);
  };

  return (
    <Container onPress={() => handlerSelect()}>
      <Initials>{name.trim().slice(0, 2).toUpperCase()}</Initials>
      <InfoArea>
        <CustomerName>{name}</CustomerName>
        <CustomerMeta numberOfLines={1}>{phone || email || document || "Sem contato informado"}</CustomerMeta>
      </InfoArea>
      <ChevronRight size={18} color={theme.colors.muted} />
    </Container>
  );
};
