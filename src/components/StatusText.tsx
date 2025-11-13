import React from "react";
import { Text, StyleSheet } from "react-native";

type StatusTextProps = {
  message: string;
  isError?: boolean;
};

/**
 * Simple status text component to display current operation status
 */
export function StatusText({ message, isError = false }: StatusTextProps) {
  return (
    <Text style={[styles.statusText, isError && styles.errorText]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  statusText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  errorText: {
    color: "#d32f2f",
    fontWeight: "500",
  },
});


