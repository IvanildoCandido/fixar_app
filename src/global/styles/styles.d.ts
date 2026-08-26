import "styled-components/native";
import { FixarTheme } from "./theme";

declare module "styled-components/native" {
  export interface DefaultTheme extends FixarTheme {}
}
