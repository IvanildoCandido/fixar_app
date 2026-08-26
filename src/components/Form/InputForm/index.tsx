import { LegacyRef } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { TextInputProps } from "react-native";
import {
  TextInputMask,
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from "react-native-masked-text";
import { Input } from "../Input";
import { Container, Error } from "./styles";

interface Props<T extends FieldValues> extends TextInputProps {
  control: Control<T>;
  type: TextInputMaskTypeProp;
  rawValue?: LegacyRef<TextInputMask>;
  options?: TextInputMaskOptionProp;
  name: Path<T>;
  label: string;
  error?: unknown;
}

export const InputForm = <T extends FieldValues>({
  control,
  name,
  error,
  type,
  rawValue,
  options,
  ...rest
}: Props<T>) => {
  return (
    <Container>
      <Controller
        control={control}
        render={({ field: { onChange, value } }) => (
          <Input
            onChangeText={onChange}
            value={value}
            type={type}
            rawValue={rawValue}
            options={options}
            {...rest}
          />
        )}
        name={name}
      />
      {typeof error === "string" && error ? <Error>{error}</Error> : null}
    </Container>
  );
};
