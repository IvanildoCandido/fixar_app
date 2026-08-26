import styled from "styled-components/native";

export const Container = styled.ScrollView`
  width: 100%;
  min-height: 64px; max-height: 132px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: 11px 14px;
`;

export const CustomerName = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 3px 0;
`;
export const EmptyText = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.muted}; margin-top: 10px;`;
export const ItemLabel = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  color: ${({ theme }) => theme.colors.title};
  margin: 8px 0;
`;

export const LabelArea = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
`;

export const CountBadge = styled.View`min-width: 24px; height: 24px; padding: 0 7px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.pill}px; background-color: ${({ theme }) => theme.colors.secondary}; margin-left: auto; margin-right: 4px;`;
export const CountText = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.secondaryForeground};`;
export const ActionButton = styled.TouchableOpacity`width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px; background-color: ${({ theme }) => theme.colors.secondary};`;
