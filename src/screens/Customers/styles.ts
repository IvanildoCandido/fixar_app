import { FlatList } from "react-native";
import styled from "styled-components/native";
import { CustomerStats } from "../../types/data";

const CustomerFlatList = FlatList<CustomerStats>;

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const CustomersList = styled(CustomerFlatList)`
  padding-top: 0;
`;
