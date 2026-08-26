import styled from "styled-components/native";

export const Container = styled.View`
  width: 100%;
  margin-bottom: 6px;
`;

export const Error = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  color: ${({ theme }) => theme.colors.attention};
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  margin: 4px 0 3px;
`;
