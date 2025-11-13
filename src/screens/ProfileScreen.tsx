import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { BenkiLogo } from "../components/BenkiLogo";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <BenkiLogo width={140} height={40} />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          </View>
          <Text style={styles.email}>{user?.email || "Not signed in"}</Text>
          <Text style={styles.userId}>User ID: {user?.id?.substring(0, 8) || "N/A"}...</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.settingItemText}>Sign Out</Text>
          <Text style={styles.settingItemArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Benki v0.1.0</Text>
        <Text style={styles.footerSubtext}>Voice transcription made simple</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  profileSection: {
    marginBottom: 30,
  },
  profileCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF3B00",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  email: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    textAlign: "center",
  },
  userId: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  settingItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#d32f2f",
  },
  settingItemArrow: {
    fontSize: 18,
    color: "#666",
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#999",
  },
});

