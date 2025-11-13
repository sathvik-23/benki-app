import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, G } from "react-native-svg";

interface BenkiLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
}

export function BenkiLogo({ width = 120, height = 32, showText = true }: BenkiLogoProps) {
  const flameSize = 24;
  const textSize = 20;
  
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.logoContent}>
        {/* Flame SVG icon */}
        <Svg
          width={flameSize}
          height={flameSize}
          viewBox="0 0 20 24"
          style={styles.flameIcon}
        >
          <G transform="translate(0, 4)">
            <Path
              d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
              fill="#FF3B00"
              stroke="#FF3B00"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        </Svg>
        {showText && (
          <Text style={[styles.logoText, { fontSize: textSize }]}>Benki</Text>
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
  flameIcon: {
    marginRight: 8,
  },
  logoText: {
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "Inter, system-ui, sans-serif",
  },
});

