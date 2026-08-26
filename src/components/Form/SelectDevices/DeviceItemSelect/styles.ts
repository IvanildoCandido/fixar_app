import styled from "styled-components/native";
export const Container = styled.TouchableOpacity`min-height: 64px; padding: 12px 14px; flex-direction: row; align-items: center; border-radius: ${({ theme }) => theme.radii.md}px; border: 1px solid ${({ theme }) => theme.colors.border}; background-color: ${({ theme }) => theme.colors.surface};`;
export const InfoArea = styled.View`flex: 1;`;
export const Label = styled.View`flex-direction: row; align-items: center; gap: 5px;`;
export const Title = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.muted};`;
export const DeviceLocation = styled.Text`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export const DeviceReference = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.primary};`;
