import styled from "styled-components/native";

export const Container = styled.TouchableOpacity`
  width: 100%;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  justify-content: space-between;
  align-items: center;
  min-height: 52px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: 0 14px;
`;

export const CustomerName = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.body.size}px;
  color: ${({ theme }) => theme.colors.ink};
`;
export const LabelCustomer = styled.Text`
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  color: ${({ theme }) => theme.colors.muted};
  margin: 10px 0 7px;
`;
