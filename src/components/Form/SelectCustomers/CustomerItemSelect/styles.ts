import styled from "styled-components/native";

export const Container = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  min-height: 68px;
  background-color: ${({ theme }) => theme.colors.surface};
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

export const Initials = styled.Text`
  width: 40px; height: 40px; padding-top: 10px; margin-right: 12px; text-align: center;
  border-radius: ${({ theme }) => theme.radii.md}px; overflow: hidden;
  background-color: ${({ theme }) => theme.colors.secondary}; color: ${({ theme }) => theme.colors.secondaryForeground};
  font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
`;
export const InfoArea = styled.View`flex: 1;`;

export const CustomerName = styled.Text`
  font-size: ${({ theme }) => theme.typography.body.size}px;
  font-family: ${({ theme }) => theme.fonts.semibold};
  color: ${({ theme }) => theme.colors.ink};
`;

export const CustomerMeta = styled.Text`margin-top: 3px; font-size: ${({ theme }) => theme.typography.caption.size}px; font-family: ${({ theme }) => theme.fonts.regular}; color: ${({ theme }) => theme.colors.muted};`;
