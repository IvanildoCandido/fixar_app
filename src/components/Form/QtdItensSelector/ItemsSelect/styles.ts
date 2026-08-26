import styled from "styled-components/native";
interface SelectionProps { isActive: boolean; }
export const Container = styled.TouchableOpacity<SelectionProps>`
  min-height: 56px; padding: 12px 14px; flex-direction: row; justify-content: space-between; align-items: center;
  border-radius: ${({ theme }) => theme.radii.md}px; border: 1px solid ${({ theme, isActive }) => isActive ? theme.colors.primary : theme.colors.border};
  background-color: ${({ theme, isActive }) => isActive ? theme.colors.secondary : theme.colors.surface};
`;
export const InfoArea = styled.View`flex: 1;`;
export const CustomerName = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.foreground};`;

