import styled from "styled-components/native";
export { ListCard as Container, ListTitle as ReferenceName, ListActions as IconsArea, ListContent as InfoArea, IconAction as TouchAction, ListMeta as LocationName, ListMeta as CustomerName } from "../../design-system/listStyles";
export const Label = styled.View`flex-direction: row; align-items: center; gap: 5px;`;
export const Title = styled.Text`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.muted};`;
