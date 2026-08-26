import styled from "styled-components/native";

interface ButtonProps {
  type: "save" | "cancel";
}

export const Container = styled.TouchableOpacity<ButtonProps>`
  background-color: ${({ theme, type }) => type === "save" ? theme.colors.primary : theme.colors.surface};
  flex: 1;
  min-height: 48px;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border: 1px solid ${({ theme, type }) => type === "save" ? theme.colors.primary : theme.colors.border};
  margin-top: 12px;
`;

export const Title = styled.Text<ButtonProps>`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.typography.body.size}px;
  color: ${({ theme, type }) => type === "save" ? theme.colors.primaryForeground : theme.colors.foreground};
`;
