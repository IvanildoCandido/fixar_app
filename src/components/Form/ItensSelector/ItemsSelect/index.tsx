import { SetStateAction, useState } from "react";
import { ItensProps } from "..";

import { Container, CustomerName, InfoArea } from "./styles";
import { Check } from "lucide-react-native";
import { useTheme } from "styled-components/native";

interface Props {
  id: string;
  name: string;
  description?: string;
  price: string;
  setItensSelected: React.Dispatch<SetStateAction<ItensProps[]>>;
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  itensSelected: ItensProps[];
}

export const ItensSelect = ({
  id,
  name,
  description,
  price,
  setItensSelected,
  itensSelected,
  closeModal,
}: Props) => {
  const theme = useTheme();
  const selected = Boolean(itensSelected.find((item) => item.id === id));
  const handlerSelect = () => {
    if (itensSelected.find((item) => item.id === id)) {
      setItensSelected(itensSelected.filter((item) => item.id !== id));
    } else {
      setItensSelected([...itensSelected, { id, name, description, price, quantity: 1 }]);
    }
  };
  return (
    <Container
      isActive={selected}
      onPress={() => handlerSelect()}
    >
      <InfoArea>
        <CustomerName>{name}</CustomerName>
      </InfoArea>
      {selected ? <Check size={18} color={theme.colors.primary} /> : null}
    </Container>
  );
};
