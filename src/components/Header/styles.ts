import styled from "styled-components/native";

export const Container = styled.View`
  background-color: ${({ theme }) => theme.colors.primary};
  width: 100%;
  min-height: 108px;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  padding: 48px 20px 14px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
`;

export const Title = styled.Text`
  font-family: ${({ theme }) => theme.fonts.bold};
  color: ${({ theme }) => theme.colors.primaryForeground};
  font-size: ${({ theme }) => theme.typography.heading.size}px;
  text-align: center;
`;

export const ActionButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: rgba(255, 255, 255, 0.2);
`;

export const ActionSpacer = styled.View`
  width: 44px;
  height: 44px;
`;
