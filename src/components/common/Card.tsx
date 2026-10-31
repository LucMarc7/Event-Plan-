import { Card as PaperCard } from "react-native-paper";
import { theme } from "../../theme";

export const Card = (props: PaperCard.Props) => (
  <PaperCard
    mode="elevated"
    style={{ borderRadius: theme.roundness, marginVertical: 8 }}
    {...props}
  />
);
