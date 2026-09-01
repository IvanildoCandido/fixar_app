import styled from "styled-components/native";

export const Container = styled.View`flex: 1; background-color: ${({ theme }) => theme.colors.background};`;
export const Content = styled.ScrollView.attrs(({ theme }) => ({
  automaticallyAdjustKeyboardInsets: true,
  keyboardDismissMode: "interactive",
  keyboardShouldPersistTaps: "handled",
  contentContainerStyle: { padding: theme.spacing.lg, paddingBottom: 140 },
}))``;
export const LogoCard = styled.View`margin-bottom: ${({ theme }) => theme.spacing.xl}px; padding: ${({ theme }) => theme.spacing.lg}px; align-items: center; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: ${({ theme }) => theme.colors.card};`;
export const LogoPreview = styled.Image`width: 100%; height: 160px; margin-bottom: ${({ theme }) => theme.spacing.lg}px;`;
export const LogoPlaceholder = styled.View`width: 92px; height: 92px; margin-bottom: ${({ theme }) => theme.spacing.md}px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: ${({ theme }) => theme.colors.secondary};`;
export const Actions = styled.View`gap: ${({ theme }) => theme.spacing.md}px; margin-top: ${({ theme }) => theme.spacing.sm}px;`;
