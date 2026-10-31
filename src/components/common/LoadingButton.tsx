// src/components/common/LoadingButton.tsx
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

interface LoadingButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

const LoadingButton = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = "primary",
}: LoadingButtonProps) => {
  const backgroundColor =
    variant === "primary"
      ? "#4F46E5"
      : variant === "danger"
        ? "#EF4444"
        : "#F1F5F9";
  const textColor = variant === "secondary" ? "#0F172A" : "#FFF";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        (disabled || loading) && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: hp(6.5),
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: wp(6),
  },
  text: {
    fontSize: hp(1.9),
    fontWeight: "700",
  },
});

export default LoadingButton;
