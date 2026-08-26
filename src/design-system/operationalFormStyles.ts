import styled from "styled-components/native";
import { Platform } from "react-native";
export const OperationalContainer = styled.KeyboardAvoidingView.attrs({ behavior: Platform.OS === "ios" ? "padding" : "height", keyboardVerticalOffset: 0 })`flex: 1; background-color: ${({ theme }) => theme.colors.background};`;
export const OperationalContent = styled.ScrollView.attrs({
  automaticallyAdjustKeyboardInsets: true,
  keyboardDismissMode: "interactive",
  keyboardShouldPersistTaps: "handled",
  contentContainerStyle: { padding: 20, paddingTop: 24, paddingBottom: 140 },
})``;
export const InfoText = styled.Text`margin: 18px 0 8px; font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.label.size}px; color: ${({ theme }) => theme.colors.title};`;
export const TextArea = styled.TextInput`min-height: 112px; padding: 14px 16px; text-align-vertical: top; border: 1px solid ${({ theme }) => theme.colors.input}; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: ${({ theme }) => theme.colors.surface}; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export const EntriesArea = styled.View`flex-direction: row; gap: 12px; margin-top: 10px;`;
export const Side = styled.View`flex: 1;`;
export const TotalArea = styled.View`margin: 8px 0 4px; padding: 18px; flex-direction: row; justify-content: space-between; align-items: center; border-radius: ${({ theme }) => theme.radii.lg}px; border: 1px solid ${({ theme }) => theme.colors.border}; background-color: ${({ theme }) => theme.colors.surface};`;
export const TotalLabel = styled.Text`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.muted};`;
export const TotalValue = styled.Text`font-family: ${({ theme }) => theme.fonts.bold}; font-size: ${({ theme }) => theme.typography.sectionTitle.size}px; color: ${({ theme }) => theme.colors.primary};`;
export const ButtonsArea = styled.View`flex-direction: row; gap: 12px; margin-top: 4px;`;
export const ScanArea = styled.View`width: 100%; flex-direction: row; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: ${({ theme }) => theme.colors.surface}; margin-bottom: 14px;`;
export const SelectionArea = styled.View`width: 100%;`;
export const ReferenceCode = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export const CustomerName = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.primary};`;
export const Label = styled.Text`margin: 2px 0 5px; font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.label.size}px; color: ${({ theme }) => theme.colors.muted};`;
export const InfoArea = styled.View`flex: 1; padding-right: 12px;`;
