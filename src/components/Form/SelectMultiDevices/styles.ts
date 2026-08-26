import styled from "styled-components/native";

export const Container = styled.ScrollView`
  width: 100%;
  min-height: 80px; max-height: 120px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: 10px 12px;
`;

export const CustomerName = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  margin-top: 5px;
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
