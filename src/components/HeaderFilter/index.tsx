import { useNavigation } from "@react-navigation/native";
import React from "react";
import { ArrowLeft, ListFilter, X } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import {
  Container,
  Title,
  ActionButton,
  ActionSpacer,
} from "./styles";

interface HeaderProps {
  title: string;
  onPress?: () => void;
  icons?: boolean;
}

export const HeaderFilter = ({ title, onPress, icons }: HeaderProps) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  return (
    <Container>
      <ActionButton accessibilityRole="button" accessibilityLabel={icons ? "Voltar" : "Filtrar"} onPress={icons ? () => navigation.goBack() : onPress}>
        {icons ? <ArrowLeft size={23} strokeWidth={2.4} color={theme.colors.primaryForeground} /> : <ListFilter size={23} strokeWidth={2.4} color={theme.colors.primaryForeground} />}
      </ActionButton>
      <Title>{title}</Title>
      {icons ? <ActionSpacer /> : <ActionButton accessibilityRole="button" accessibilityLabel="Voltar ao início" onPress={() => navigation.navigate("Home")}><X size={23} strokeWidth={2.4} color={theme.colors.primaryForeground} /></ActionButton>}
    </Container>
  );
};
