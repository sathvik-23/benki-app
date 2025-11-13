import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { historyService } from "../services/historyService";
import { useAuth } from "../contexts/AuthContext";
import { Session } from "../types/supabase";

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadSessions = useCallback(async (reset: boolean = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const { data, error } = await historyService.getUserSessions(20, currentOffset);

      if (error) {
        Alert.alert("Error", "Failed to load sessions");
        return;
      }

      if (data) {
        if (reset) {
          setSessions(data);
          setOffset(data.length);
        } else {
          setSessions((prev) => [...prev, ...data]);
          setOffset((prev) => prev + data.length);
        }

        setHasMore(data.length === 20);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      Alert.alert("Error", "Failed to load sessions");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [offset]);

  useEffect(() => {
    loadSessions(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    loadSessions(true);
  }, [loadSessions]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadSessions(false);
    }
  }, [loadingMore, hasMore, loadSessions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
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
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getSessionTypeLabel = (type: string) => {
    return "Record";
  };

  const handleSessionPress = (session: Session) => {
    navigation.navigate("SessionDetail" as never, { sessionId: session.id } as never);
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTypeBadge}>
            <Text style={styles.sessionTypeText}>
              {getSessionTypeLabel(item.session_type)}
            </Text>
          </View>
          <Text style={styles.sessionDate}>{formatDate(item.created_at)}</Text>
        </View>
        {item.title && (
          <Text style={styles.sessionTitle}>{item.title}</Text>
        )}
        <View style={styles.sessionFooter}>
          <Text style={styles.sessionDuration}>
            Duration: {formatDuration(item.total_duration_ms)}
          </Text>
          <Text style={styles.sessionStatus}>
            {item.status === "completed" ? "✓ Completed" : item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No sessions yet</Text>
        <Text style={styles.emptySubtext}>
          Start recording to create your first session
        </Text>
      </View>
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
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
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionTypeBadge: {
    backgroundColor: "#FF3B00",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionTypeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  sessionDate: {
    fontSize: 12,
    color: "#666",
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  sessionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sessionDuration: {
    fontSize: 14,
    color: "#666",
  },
  sessionStatus: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "500",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
