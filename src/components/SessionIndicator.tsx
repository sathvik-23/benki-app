import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Session } from "../types/supabase";

interface SessionIndicatorProps {
  session: Session | null;
  onNewSession: () => void;
  chunkCount?: number;
}

export function SessionIndicator({
  session,
  onNewSession,
  chunkCount,
}: SessionIndicatorProps) {
  if (!session) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.newSessionButton} onPress={onNewSession}>
          <Text style={styles.newSessionText}>+ New Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sessionTypeLabel =
    session.session_type === "single_record" ? "Record" : "Live";
  const date = new Date(session.created_at).toLocaleDateString();

  return (
    <View style={styles.container}>
      <View style={styles.sessionInfo}>
        <View style={styles.sessionHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{sessionTypeLabel}</Text>
          </View>
          {chunkCount !== undefined && (
            <Text style={styles.chunkCount}>{chunkCount} chunks</Text>
          )}
        </View>
        <Text style={styles.sessionDate}>Started: {date}</Text>
      </View>
      <TouchableOpacity style={styles.newSessionButton} onPress={onNewSession}>
        <Text style={styles.newSessionText}>New Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  badge: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  chunkCount: {
    fontSize: 12,
    color: "#666",
  },
  sessionDate: {
    fontSize: 12,
    color: "#666",
  },
  newSessionButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  newSessionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
