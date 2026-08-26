import styled from "styled-components/native";

export const Container = styled.View`flex: 1; background-color: ${({ theme }) => theme.colors.background};`;
export const Header = styled.View`
  padding: 58px 24px 30px; border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px; background-color: ${({ theme }) => theme.colors.primary};
`;
export const HeaderTop = styled.View`flex-direction: row; align-items: center; gap: 8px; margin-bottom: 28px;`;
export const CompanyBadge = styled.View`flex: 1; flex-direction: row; align-items: center;`;
export const CompanyName = styled.Text`
  margin-left: 9px; font-family: ${({ theme }) => theme.fonts.bold}; font-size: 23px; color: ${({ theme }) => theme.colors.primaryForeground};
`;
export const SignOutButton = styled.TouchableOpacity`
  width: 42px; height: 42px; border-radius: 14px; align-items: center; justify-content: center;
  background-color: rgba(255, 255, 255, 0.14);
`;
export const Kicker = styled.Text`
  font-family: ${({ theme }) => theme.fonts.medium}; font-size: 12px; text-transform: uppercase;
  letter-spacing: 1px; color: ${({ theme }) => theme.colors.secondary};
`;
export const Greeting = styled.Text`
  margin-top: 4px; font-family: ${({ theme }) => theme.fonts.bold}; font-size: 26px; color: ${({ theme }) => theme.colors.primaryForeground};
`;
export const Subtitle = styled.Text`
  margin-top: 5px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: 13px; color: ${({ theme }) => theme.colors.secondary};
`;
export const Content = styled.ScrollView.attrs({ contentContainerStyle: { padding: 22, paddingBottom: 120 } })``;
export const SectionTitle = styled.Text`
  margin: 8px 0 14px; font-family: ${({ theme }) => theme.fonts.bold}; font-size: 16px;
  color: ${({ theme }) => theme.colors.ink};
`;
export const Stats = styled.View`flex-direction: row; gap: 10px; margin-bottom: 22px;`;
export const ReminderList = styled.View`gap: 10px; margin-bottom: 22px;`;
export const ReminderCard = styled.View`
  min-height: 68px; flex-direction: row; align-items: center; gap: 12px; padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.lg}px; border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.card};
`;
export const ReminderContent = styled.View`flex: 1;`;
export const ReminderTitle = styled.Text`
  font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.body.size}px;
  color: ${({ theme }) => theme.colors.foreground};
`;
export const ReminderMeta = styled.Text`
  margin-top: 2px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.caption.size}px;
  color: ${({ theme }) => theme.colors.muted};
`;
export const ReminderDate = styled.Text<{ due: boolean }>`
  max-width: 100px; text-align: right; font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  color: ${({ theme, due }) => due ? theme.colors.warning : theme.colors.primary};
`;
export const ReminderEmpty = styled.Text`
  padding: 14px; font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.muted};
`;
export const StatCard = styled.View`
  flex: 1; min-height: 104px; padding: 15px 12px; border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border}; background-color: ${({ theme }) => theme.colors.card};
`;
export const StatNumber = styled.Text`
  font-family: ${({ theme }) => theme.fonts.bold}; font-size: 25px; color: ${({ theme }) => theme.colors.primary};
`;
export const StatLabel = styled.Text`
  margin-top: 7px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: 10px;
  line-height: 15px; color: ${({ theme }) => theme.colors.muted};
`;
export const ActionsGrid = styled.View`flex-direction: row; flex-wrap: wrap; gap: 12px;`;
export const ButtonsArea = styled.View`
  padding: 12px 22px;
  align-items: center;
`;
export const Action = styled.TouchableOpacity`
  width: 48%; min-height: 124px; padding: 16px; justify-content: space-between;
  border-radius: 20px; border: 1px solid ${({ theme }) => theme.colors.border}; background-color: ${({ theme }) => theme.colors.card};
`;
export const ActionIcon = styled.View`
  width: 46px; height: 46px; border-radius: 15px; align-items: center; justify-content: center;
  background-color: ${({ theme }) => theme.colors.secondary};
`;
export const ActionLabel = styled.Text`
  margin-top: 14px; font-family: ${({ theme }) => theme.fonts.medium}; font-size: 13px;
  color: ${({ theme }) => theme.colors.ink};
`;
