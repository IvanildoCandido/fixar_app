import styled from "styled-components/native";

export const ListCard = styled.View`min-height: 76px; margin: 0 16px 8px; padding: 14px 14px 14px 16px; flex-direction: row; align-items: center; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: ${({ theme }) => theme.colors.surface};`;
export const ListContent = styled.View`flex: 1; padding-right: 10px;`;
export const ListTitle = styled.Text.attrs({ numberOfLines: 1 })`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.heading.size}px; line-height: ${({ theme }) => theme.typography.heading.lineHeight}px; color: ${({ theme }) => theme.colors.foreground};`;
export const ListMeta = styled.Text.attrs({ numberOfLines: 1 })`margin-top: 2px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.muted};`;
export const ListActions = styled.View`flex-direction: row; gap: 4px;`;
export const IconAction = styled.TouchableOpacity`width: ${({ theme }) => theme.touchTarget}px; height: ${({ theme }) => theme.touchTarget}px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px;`;
export const InlineMeta = styled.View`margin-top: 6px; flex-direction: row; align-items: center; gap: 6px;`;
export const CountBadge = styled.Text`padding: 2px 7px; overflow: hidden; border-radius: ${({ theme }) => theme.radii.pill}px; font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.secondaryForeground}; background-color: ${({ theme }) => theme.colors.secondary};`;
export const PriceText = styled.Text`margin-top: 3px; font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.primary};`;
