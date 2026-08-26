import React, { LegacyRef } from "react";
import { TextInputProps } from "react-native";
import {
  TextInputMask,
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from "react-native-masked-text";
import { useTheme } from "styled-components/native";
import { Container, Label } from "./styles";

interface Props extends TextInputProps {
  label: string;
  type: TextInputMaskTypeProp;
  rawValue?: LegacyRef<TextInputMask>;
  options?: TextInputMaskOptionProp;
}

export const Input = ({ label, type, rawValue, options, ...rest }: Props) => {
  const theme = useTheme();
  return (
    <>
      <Label>{label}</Label>
      <Container
        placeholderTextColor={theme.colors.muted}
        ref={rawValue}
        type={type}
        options={options}
        {...rest}
      />
    </>
  );
};
