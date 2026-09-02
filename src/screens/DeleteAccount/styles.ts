import styled from "styled-components/native";
export const Container = styled.View`flex:1;background-color:${({theme})=>theme.colors.background};`;
export const Content = styled.ScrollView``;
export const DangerTitle = styled.Text`font-family:${({theme})=>theme.fonts.bold};font-size:22px;color:${({theme})=>theme.colors.danger};`;
export const Heading = styled.Text`font-family:${({theme})=>theme.fonts.semibold};font-size:16px;color:${({theme})=>theme.colors.foreground};`;
export const Body = styled.Text`font-family:${({theme})=>theme.fonts.regular};font-size:14px;line-height:21px;color:${({theme})=>theme.colors.foreground};`;
export const Label = styled.Text`font-family:${({theme})=>theme.fonts.semibold};font-size:12px;color:${({theme})=>theme.colors.foreground};`;
export const Note = styled.Text`font-family:${({theme})=>theme.fonts.regular};font-size:12px;line-height:18px;color:${({theme})=>theme.colors.muted};`;
