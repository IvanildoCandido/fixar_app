import { FlatList } from "react-native";
import styled from "styled-components/native";
import { Device } from "../../types/data";

const DeviceFlatList = FlatList<Device>;

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;
export const DevicesList = styled(DeviceFlatList)`
  padding-top: 16px;
`;
