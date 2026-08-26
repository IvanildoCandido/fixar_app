import styled from "styled-components/native";

export const Container = styled.ScrollView.attrs({
  automaticallyAdjustKeyboardInsets: true,
  keyboardDismissMode: "interactive",
  keyboardShouldPersistTaps: "handled",
})`
  width: 100%;
  max-height: 180px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: 10px 12px;
`;
export const ItensArea = styled.View`
  padding: 5px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 2px;
`;
export const ItemName = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  margin-top: 5px;
`;
export const QtdItem = styled.TextInput`
  width: 54px;
  min-height: ${({ theme }) => theme.touchTarget}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  color: ${({ theme }) => theme.colors.foreground};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.colors.input};
  border-radius: ${({ theme }) => theme.radii.sm}px;
`;
export const ItemLabel = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.label.size}px;
  color: ${({ theme }) => theme.colors.title};
  margin-top: 5px;
  margin-bottom: 5px;
`;

export const LabelArea = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 5px 0;
`;

export const ActionButton = styled.TouchableOpacity`width: ${({ theme }) => theme.touchTarget}px; height: ${({ theme }) => theme.touchTarget}px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px;`;
