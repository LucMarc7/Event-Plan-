import { ButtonProps, Button as PaperButton } from "react-native-paper";
import { theme } from "../../theme";

export const Button = (props: ButtonProps) => (
  <PaperButton
    mode="contained"
    uppercase={false}
    style={{ borderRadius: theme.roundness }}
    labelStyle={{ fontWeight: "600" }}
    {...props}
  />
);
