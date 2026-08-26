import styled from "styled-components/native";

export const Container = styled.KeyboardAvoidingView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.overlay};
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
`;

export const ModalTitle = styled.Text`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.sectionTitle.size}px;
  line-height: ${({ theme }) => theme.typography.sectionTitle.lineHeight}px;
  font-family: ${({ theme }) => theme.fonts.semibold};
  color: ${({ theme }) => theme.colors.ink};
`;

export const ModalDescription = styled.Text`
  margin-top: 4px;
  margin-bottom: 18px;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  color: ${({ theme }) => theme.colors.muted};
`;

export const HeaderArea = styled.View`flex-direction: row; align-items: center;`;
export const CloseButton = styled.TouchableOpacity`
  width: ${({ theme }) => theme.touchTarget}px; height: ${({ theme }) => theme.touchTarget}px;
  margin-right: -10px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px;
`;

export const BoxBody = styled.View`
  width: 100%; max-width: 520px; max-height: 88%;
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.xl}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 20px;
`;

export const FormScroll = styled.ScrollView`flex-shrink: 1;`;
export const ReferenceField = styled.View`flex: 1;`;

export const ButtonsArea = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border};
`;

export const LabelCustomer = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.title};
  margin-top: 5px;
  margin-bottom: 5px;
`;

export const ScanArea = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: flex-end;
`;

export const ButtonScan = styled.TouchableOpacity`
  width: 52px; height: 52px; margin-left: 10px; margin-bottom: 3px;
  align-items: center; justify-content: center;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md}px;
`;
