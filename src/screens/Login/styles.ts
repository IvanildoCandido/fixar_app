import styled from "styled-components/native";

export const Container = styled.ScrollView.attrs({
  automaticallyAdjustKeyboardInsets: true,
  keyboardDismissMode: "interactive",
  keyboardShouldPersistTaps: "handled",
  contentContainerStyle: { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 40 },
})`
  background-color: ${({ theme }) => theme.colors.background};
`;

export const BrandMark = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary};
`;

export const Brand = styled.Text`
  margin-top: 14px;
  font-family: ${({ theme }) => theme.fonts.bold};
  font-size: 34px;
  color: ${({ theme }) => theme.colors.ink};
`;

export const BrandSubtitle = styled.Text`
  margin-top: -4px;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: 14px;
  line-height: 21px;
  color: ${({ theme }) => theme.colors.muted};
`;

export const Card = styled.View`
  margin-top: 28px;
  padding: 20px;
  border-radius: ${({ theme }) => theme.radii.xl}px;
  background-color: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Title = styled.Text`
  margin-bottom: 18px;
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.typography.sectionTitle.size}px;
  color: ${({ theme }) => theme.colors.ink};
`;

export const Field = styled.View`
  margin-bottom: 16px;
`;

export const FieldLabel = styled.Text`
  margin-bottom: 7px;
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;

export const Input = styled.TextInput.attrs(({ theme }) => ({
  placeholderTextColor: theme.colors.muted,
}))`
  height: 48px;
  padding: 0 15px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md}px;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.ink};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`;

export const Button = styled.TouchableOpacity<{ variant?: "primary" | "secondary" | "ghost" }>`
  min-height: ${({ variant }) => variant === "ghost" ? 40 : 48}px;
  margin-top: 8px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, variant }) => variant === "secondary" ? theme.colors.secondary : variant === "ghost" ? "transparent" : theme.colors.primary};
  border: 1px solid ${({ theme, variant }) => variant === "secondary" ? theme.colors.border : "transparent"};
`;

export const ButtonLabel = styled.Text<{ variant?: "primary" | "secondary" | "ghost" }>`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: 14px;
  color: ${({ theme, variant }) => variant === "secondary" ? theme.colors.secondaryForeground : variant === "ghost" ? theme.colors.primary : theme.colors.primaryForeground};
`;

export const Footer = styled.Text`
  margin-top: 22px;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: 11px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.muted};
`;
