import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BenkiLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
}

export function BenkiLogo({ width = 120, height = 32, showText = true }: BenkiLogoProps) {
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.logoContent}>
        {/* Flame icon represented as a simple colored view */}
        <View style={styles.flameContainer}>
          <View style={styles.flame} />
        </View>
        {showText && (
          <Text style={styles.logoText}>Benki</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  flameContainer: {
    width: 24,
    height: 24,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  flame: {
    width: 16,
    height: 20,
    backgroundColor: "#FF3B00",
    borderRadius: 8,
    transform: [{ rotate: "45deg" }],
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "Inter, system-ui, sans-serif",
  },
});

