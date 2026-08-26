import styled from "styled-components/native";
import { TextInputMask } from "react-native-masked-text";

export const Label = styled.Text`
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  color: ${({ theme }) => theme.colors.muted};
  margin: 8px 0 7px;
`;

export const Container = styled(TextInputMask)`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.body.size}px;
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.input};
  border-radius: ${({ theme }) => theme.radii.md}px;
  color: ${({ theme }) => theme.colors.ink};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`;
