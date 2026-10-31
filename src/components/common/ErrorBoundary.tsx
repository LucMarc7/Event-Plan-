// src/components/common/ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";
import { Button, Text, View } from "react-native";

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
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Une erreur est survenue
          </Text>
          <Text style={{ textAlign: "center", marginBottom: 20 }}>
            {this.state.error?.message}
          </Text>
          <Button
            title="Réessayer"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }
    return this.props.children;
  }
}
