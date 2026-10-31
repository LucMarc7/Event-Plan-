// src/components/ui/ErrorBoundary.tsx
import { Feather } from "@expo/vector-icons";
import React, { Component, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    spacing,
} from "../../theme/tokens";
import Button from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Erreur de rendu :", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Feather
              name="alert-triangle"
              size={iconSize.xl}
              color={colors.error}
            />
          </View>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.message}>
            {this.state.error?.message || "Erreur inattendue"}
          </Text>
          <View style={styles.action}>
            <Button
              title="Réessayer"
              variant="primary"
              size="md"
              onPress={() => this.setState({ hasError: false, error: null })}
              fullWidth={false}
            />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.errorSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  action: { marginTop: spacing.md },
});

export default ErrorBoundary;
