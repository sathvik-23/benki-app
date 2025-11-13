import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { historyService } from "../services/historyService";
import { SessionWithChunks } from "../types/supabase";

export default function SessionDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { sessionId } = route.params as { sessionId: string };
  const [session, setSession] = useState<SessionWithChunks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const { data, error } = await historyService.getSessionWithChunks(sessionId);

      if (error) {
        Alert.alert("Error", "Failed to load session details");
        navigation.goBack();
        return;
      }

      setSession(data);
    } catch (error) {
      console.error("Error loading session:", error);
      Alert.alert("Error", "Failed to load session details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (session?.full_transcript) {
      await Clipboard.setStringAsync(session.full_transcript);
      Alert.alert("Success", "Transcript copied to clipboard");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await historyService.deleteSession(sessionId);
            if (error) {
              Alert.alert("Error", "Failed to delete session");
            } else {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    }
    return `${remainingMinutes}m ${remainingSeconds}s`;
  };

  const getSessionTypeLabel = (type: string) => {
    return type === "single_record" ? "Record" : "Record";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B00" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{getSessionTypeLabel(session.session_type)}</Text>
          </View>
          <Text style={styles.date}>{formatDate(session.created_at)}</Text>
        </View>

        {session.title && (
          <Text style={styles.title}>{session.title}</Text>
        )}

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Duration</Text>
            <Text style={styles.metadataValue}>
              {formatDuration(session.total_duration_ms)}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Status</Text>
            <Text style={styles.metadataValue}>
              {session.status === "completed" ? "Completed" : session.status}
            </Text>
          </View>
        </View>

        <View style={styles.transcriptSection}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptLabel}>Transcript</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyTranscript}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptText}>
              {session.full_transcript || "No transcript available"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: "#FF3B00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  metadata: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 16,
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  transcriptSection: {
    marginBottom: 24,
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF3B00",
    borderRadius: 6,
  },
  copyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  transcriptContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  deleteButton: {
    backgroundColor: "#f44336",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
});
