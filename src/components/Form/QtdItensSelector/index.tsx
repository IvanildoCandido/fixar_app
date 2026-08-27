import { SetStateAction, useEffect, useState } from "react";
import { Alert, Modal } from "react-native";
import { SelectionItens } from "../ItensSelector/SelectionItens";
import {
  Container,
  ItemLabel,
  LabelArea,
  ActionButton,
  ItemDescription,
  ItemInfo,
  ItemName,
  ItemTotal,
  ItensArea,
  QuantityArea,
  QuantityButton,
  QuantityValue,
} from "./styles";
import { Minus, Plus } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import type { servicesTotal } from "../../../screens/Budgets";

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
    const data = itens.map((item) => {
      const current = itensSelected.find((selected) => selected.id === item.id);
      const qtd = Math.max(1, current?.qtd ?? 1);
      return { id: item.id, name: item.name, qtd, description: item.description, price: Number(item.price), total: qtd * Number(item.price) };
    });
    setItensSelected(data);
  }, [itens]);

  const updateQuantity = (index: number, quantity: number) => {
    const qtd = Math.max(1, quantity);
    setItensSelected(itensSelected.map((item, itemIndex) => itemIndex === index ? { ...item, qtd, total: qtd * item.price } : item));
  };
  const decreaseOrRemove = (item: servicesTotal, index: number) => {
    if (item.qtd > 1) {
      updateQuantity(index, item.qtd - 1);
      return;
    }
    Alert.alert(
      "Remover item?",
      `Deseja remover “${item.name}” deste orçamento?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => setItens((current) => current.filter((selected) => selected.id !== item.id)) },
      ]
    );
  };

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
              <ItensArea key={item.id}>
                <ItemInfo><ItemName numberOfLines={2}>{item.name}</ItemName>{item.description ? <ItemDescription numberOfLines={2}>{item.description}</ItemDescription> : null}</ItemInfo>
                <QuantityArea>
                  <QuantityButton accessibilityRole="button" accessibilityLabel={item.qtd === 1 ? `Remover ${item.name}` : `Diminuir quantidade de ${item.name}`} onPress={() => decreaseOrRemove(item, index)}><Minus size={17} color={item.qtd === 1 ? theme.colors.danger : theme.colors.primary} /></QuantityButton>
                  <QuantityValue>{item.qtd}</QuantityValue>
                  <QuantityButton accessibilityRole="button" accessibilityLabel={`Aumentar quantidade de ${item.name}`} onPress={() => updateQuantity(index, item.qtd + 1)}><Plus size={17} color={theme.colors.primary} /></QuantityButton>
                </QuantityArea>
                <ItemTotal>{item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</ItemTotal>
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
