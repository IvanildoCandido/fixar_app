import styled from "styled-components/native";
export const PadLabel = styled.Text`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.label.size}px; color: ${({ theme }) => theme.colors.title};`;
export const Pad = styled.View`height: 132px; border: 1px dashed ${({ theme }) => theme.colors.input}; border-radius: ${({ theme }) => theme.radii.md}px; background-color: ${({ theme }) => theme.colors.surfaceMuted}; overflow: hidden;`;
export const ClearButton = styled.Pressable`min-height: 40px; padding: 8px 12px; align-self: flex-end; justify-content: center;`;
export const ClearText = styled.Text`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.danger};`;
