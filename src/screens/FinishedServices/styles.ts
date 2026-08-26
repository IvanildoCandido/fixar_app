import { FlatList } from "react-native";
import styled from "styled-components/native";
import { Repair } from "../../types/data";

const RepairFlatList = FlatList<Repair>;

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;
export const DevicesList = styled(RepairFlatList)`
  padding-top: ${({ theme }) => theme.spacing.md}px;
`;

export const FilterStatus = styled.Text`
  font-family: ${({ theme }) => theme.fonts.medium};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  text-align: center;
  margin: 10px 0;
`;

export const ReportAction = styled.View`
  margin: ${({ theme }) => theme.spacing.md}px ${({ theme }) => theme.spacing.lg}px 0;
  padding: ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.card};
`;

export const ReportActionContent = styled.View`
  flex: 1;
`;

export const ReportActionTitle = styled.Text`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.typography.body.size}px;
  color: ${({ theme }) => theme.colors.foreground};
`;

export const ReportActionText = styled.Text`
  margin-top: ${({ theme }) => theme.spacing.xs}px;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  color: ${({ theme }) => theme.colors.muted};
`;
