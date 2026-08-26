import styled from "styled-components/native";

export const Container = styled.View`flex: 1; justify-content: center; background-color: #07110d;`;
export const CameraArea = styled.SafeAreaView`flex: 1; padding: 18px 20px 32px; justify-content: space-between; background-color: rgba(0, 0, 0, 0.38);`;
export const Header = styled.View`flex-direction: row; align-items: flex-start; padding-top: 8px;`;
export const HeaderCopy = styled.View`flex: 1; padding-right: 12px;`;
export const Title = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.sectionTitle.size}px; color: #ffffff;`;
export const Instruction = styled.Text`margin-top: 5px; text-align: center; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px; color: rgba(255,255,255,0.84);`;
export const CloseButton = styled.TouchableOpacity`width: ${({ theme }) => theme.touchTarget}px; height: ${({ theme }) => theme.touchTarget}px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px; background-color: rgba(0,0,0,0.36);`;
export const Frame = styled.View`align-self: center; width: 272px; height: 272px; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.95); border-radius: ${({ theme }) => theme.radii.lg}px; background-color: rgba(0,0,0,0.08);`;
export const PermissionCard = styled.View`margin: 24px; padding: 24px; border-radius: ${({ theme }) => theme.radii.xl}px; background-color: ${({ theme }) => theme.colors.surface}; border: 1px solid ${({ theme }) => theme.colors.border};`;
export const ScannerIcon = styled.View`width: 52px; height: 52px; margin-bottom: 18px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: ${({ theme }) => theme.colors.secondary};`;
export const PermissionTitle = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.sectionTitle.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export const PermissionText = styled.Text`margin: 6px 0 18px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.body.size}px; line-height: ${({ theme }) => theme.typography.body.lineHeight}px; color: ${({ theme }) => theme.colors.muted};`;
