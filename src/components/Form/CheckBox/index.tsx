import { SetStateAction } from "react";
import { Container, Label } from "./styles";
import { CheckSquare, Square } from "lucide-react-native";
import { useTheme } from "styled-components/native";

interface Props {
  title: string;
  checked: boolean;
  setChecked: React.Dispatch<SetStateAction<boolean>>;
}

export const CheckBox = ({ title, checked, setChecked }: Props) => {
  const theme = useTheme();
  return (
    <Container accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => setChecked(!checked)}>
      {checked ? <CheckSquare size={20} color={theme.colors.primary} /> : <Square size={20} color={theme.colors.muted} />}
      <Label>{title}</Label>
    </Container>
  );
};
