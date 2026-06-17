import React, { useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { ErrorBoundary } from "react-error-boundary";
import reportError from "@/utils/reportError";

const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Something went wrong.</Text>
    <Text style={styles.error}>{error?.toString()}</Text>
    <Button
      title="Try Again"
      onPress={resetErrorBoundary ? resetErrorBoundary : () => {}}
    />
  </View>
);

const GlobalRuntimeErrorReporter = () => {
  useEffect(() => {
    const errorUtils = (global as { ErrorUtils?: { setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void; getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void } }).ErrorUtils;
    if (!errorUtils?.setGlobalHandler) {
      return;
    }

    const defaultHandler = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler((error, isFatal) => {
      void reportError({
        message: error?.message || "Unhandled runtime error",
        stack: error?.stack,
        route: isFatal ? "fatal-runtime" : "runtime",
      });
      defaultHandler?.(error, isFatal);
    });
  }, []);

  return null;
};

// Wrap your App or any critical component
const AppWithErrorBoundary = ({ children }: any) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error("App crash caught (Functional):", error, info);
        void reportError({
          message: error?.message || "React render error",
          stack: error?.stack,
          componentStack: info?.componentStack,
          route: "react-error-boundary",
        });
      }}
    >
      <GlobalRuntimeErrorReporter />
      {children}
    </ErrorBoundary>
  );
};

export default AppWithErrorBoundary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  error: {
    color: "red",
    marginBottom: 20,
  },
});
