import { FlatList } from "react-native";
import styled from "styled-components/native";
import { Part } from "../../types/data";

const PartFlatList = FlatList<Part>;

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;
export const PartsList = styled(PartFlatList)`
  padding-top: 16px;
`;
