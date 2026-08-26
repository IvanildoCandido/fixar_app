import styled from "styled-components/native";

export const Section = styled.View`
  margin-top: ${({ theme }) => theme.spacing.md}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  background-color: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`;
export const SectionHeader = styled.Pressable`
  min-height: 52px; padding: 10px 14px; flex-direction: row; align-items: center;
`;
export const SectionMarker = styled.View<{ $state: "complete" | "pending" | "attention" }>`
  width: 26px; height: 26px; border-radius: 13px; align-items: center; justify-content: center;
  background-color: ${({ theme, $state }) => $state === "complete" ? theme.colors.secondary : $state === "attention" ? theme.colors.dangerSurface : theme.colors.surfaceMuted};
`;
export const SectionTitle = styled.Text`flex: 1; margin-left: 10px; font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.heading.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export const SectionBody = styled.View`padding: 0 14px 14px; gap: 12px;`;
export const Helper = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.muted};`;
export const CheckRow = styled.View`padding: 10px 0; gap: 8px; border-bottom-width: 1px; border-bottom-color: ${({ theme }) => theme.colors.border};`;
export const CheckLabel = styled.Text`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export const Chips = styled.View`flex-direction: row; flex-wrap: wrap; gap: 6px;`;
export const Chip = styled.Pressable<{ $selected?: boolean; $tone?: "default" | "warning" | "danger" }>`
  min-height: 38px; padding: 8px 10px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.pill}px;
  border: 1px solid ${({ theme, $selected, $tone }) => !$selected ? theme.colors.border : $tone === "danger" ? theme.colors.danger : $tone === "warning" ? theme.colors.warning : theme.colors.primary};
  background-color: ${({ theme, $selected, $tone }) => !$selected ? theme.colors.surface : $tone === "danger" ? theme.colors.dangerSurface : $tone === "warning" ? theme.colors.surfaceMuted : theme.colors.secondary};
`;
export const ChipText = styled.Text<{ $selected?: boolean; $tone?: "default" | "warning" | "danger" }>`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme, $selected, $tone }) => !$selected ? theme.colors.muted : $tone === "danger" ? theme.colors.danger : $tone === "warning" ? theme.colors.warning : theme.colors.secondaryForeground};`;
export const MeasurementRow = styled.View`flex-direction: row; align-items: flex-end; gap: 8px;`;
export const MeasurementField = styled.View`flex: 1;`;
export const Unit = styled.Text`min-width: 34px; padding-bottom: 13px; font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.primary};`;
export const InlineAction = styled.Pressable`min-height: 44px; padding: 9px 12px; align-self: flex-start; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px; background-color: ${({ theme }) => theme.colors.secondary};`;
export const InlineActionText = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.secondaryForeground};`;
