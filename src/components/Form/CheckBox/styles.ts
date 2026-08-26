import styled from "styled-components/native";

export const Container = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  min-height: 48px;
  margin: 12px 0;
  padding: 0 4px;
`;

export const Label = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  color: ${({ theme }) => theme.colors.ink};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  margin-left: 9px;
`;
