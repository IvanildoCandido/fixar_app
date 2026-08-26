import { SetStateAction, useState } from "react";
import { ItensProps } from "..";

import { Container, CustomerName, InfoArea } from "./styles";

interface Props {
  id: string;
  customerId: string;
  reference: string;
  model: string;
  brand: string;
  location: string;
  setItensSelected: React.Dispatch<SetStateAction<ItensProps[]>>;
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  itensSelected: ItensProps[];
}

export const ItensSelect = ({
  id,
  customerId,
  reference,
  model,
  brand,
  location,
  setItensSelected,
  itensSelected,
  closeModal,
}: Props) => {
  const handlerSelect = () => {
    if (itensSelected.find((item) => item.id === id)) {
      setItensSelected(itensSelected.filter((item) => item.id !== id));
    } else {
      setItensSelected([
        ...itensSelected,
        { id, customerId, reference, model, brand, location },
      ]);
    }
  };
  return (
    <Container
      isActive={itensSelected.find((item) => item.id === id) ? true : false}
      onPress={() => handlerSelect()}
    >
      <InfoArea>
        <CustomerName>{reference}</CustomerName>
      </InfoArea>
    </Container>
  );
};
