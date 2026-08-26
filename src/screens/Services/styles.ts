import { FlatList } from "react-native";
import styled from "styled-components/native";
import { Service } from "../../types/data";

const ServiceFlatList = FlatList<Service>;

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;
export const ServicesList = styled(ServiceFlatList)`
  padding-top: 16px;
`;
