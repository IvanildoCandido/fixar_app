import { Container, Title } from "./styled";
import { TouchableOpacityProps } from "react-native";

export interface ButtonProps extends TouchableOpacityProps {
  type: "save" | "cancel";
  title: string;
}

export const Button = ({ title, ...rest }: ButtonProps) => {
  return (
    <Container {...rest}>
      <Title type={rest.type}>{title}</Title>
    </Container>
  );
};
