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
  min-height: 74px; padding: 10px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;
export const ItemInfo = styled.View`flex: 1; min-width: 0;`;
export const ItemName = styled.Text`
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  color: ${({ theme }) => theme.colors.foreground};
`;
export const ItemDescription = styled.Text`margin-top: 3px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.muted};`;
export const QuantityArea = styled.View`height: 40px; flex-direction: row; align-items: center; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.md}px; overflow: hidden;`;
export const QuantityButton = styled.Pressable`width: 40px; height: 40px; align-items: center; justify-content: center; background-color: ${({ theme }) => theme.colors.secondary};`;
export const QuantityValue = styled.Text`min-width: 30px; text-align: center; font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export const ItemTotal = styled.Text`width: 72px; text-align: right; font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.primary};`;
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
