import React from "react";
import { Keyboard, Platform } from "react-native";
import { X } from "lucide-react-native";
import styled, { useTheme } from "styled-components/native";

interface FormModalProps { title: string; description: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; }

export function FormModal({ title, description, onClose, children, footer }: FormModalProps) {
  const theme = useTheme();
  return <Backdrop behavior={Platform.OS === "ios" ? "padding" : "height"}><DismissArea activeOpacity={1} onPress={Keyboard.dismiss}><Card accessibilityViewIsModal><Header><HeaderCopy><Title>{title}</Title><Description>{description}</Description></HeaderCopy><CloseButton accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose}><X size={20} color={theme.colors.muted} /></CloseButton></Header><Body keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</Body><Footer>{footer}</Footer></Card></DismissArea></Backdrop>;
}

const Backdrop = styled.KeyboardAvoidingView`flex: 1; background-color: ${({ theme }) => theme.colors.overlay};`;
const DismissArea = styled.TouchableOpacity`flex: 1; padding: 24px 16px; align-items: center; justify-content: center;`;
const Card = styled.View`width: 100%; max-width: 520px; max-height: 90%; padding: 20px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.xl}px; background-color: ${({ theme }) => theme.colors.surface};`;
const Header = styled.View`flex-direction: row; align-items: flex-start; margin-bottom: 18px;`;
const HeaderCopy = styled.View`flex: 1; padding-right: 12px;`;
const Title = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.sectionTitle.size}px; line-height: ${({ theme }) => theme.typography.sectionTitle.lineHeight}px; color: ${({ theme }) => theme.colors.foreground};`;
const Description = styled.Text`margin-top: 4px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px; color: ${({ theme }) => theme.colors.muted};`;
const CloseButton = styled.TouchableOpacity`width: ${({ theme }) => theme.touchTarget}px; height: ${({ theme }) => theme.touchTarget}px; margin: -8px -8px 0 0; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px;`;
const Body = styled.ScrollView.attrs({
  automaticallyAdjustKeyboardInsets: true,
  keyboardDismissMode: "interactive",
  keyboardShouldPersistTaps: "handled",
  contentContainerStyle: { paddingBottom: 16 },
})`flex-shrink: 1;`;
const Footer = styled.View`margin-top: 14px; padding-top: 12px; flex-direction: row; gap: 12px; border-top-width: 1px; border-top-color: ${({ theme }) => theme.colors.border};`;
