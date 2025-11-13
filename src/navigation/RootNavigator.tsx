import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import RecordScreen from "../screens/RecordScreen";
import LiveTranscribeScreen from "../screens/LiveTranscribeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import SessionDetailScreen from "../screens/SessionDetailScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

/**
 * Auth stack for login/signup screens
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Main app stack with history detail
 */
function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{
          title: "Session Details",
          headerStyle: {
            backgroundColor: "#f5f5f5",
          },
          headerTintColor: "#000",
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Main tabs navigator
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f5f5f5",
        },
        headerTintColor: "#000",
        headerTitleStyle: {
          fontWeight: "600",
        },
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          title: "Record & Transcribe",
          tabBarLabel: "Record",
        }}
      />
      <Tab.Screen
        name="Live"
        component={LiveTranscribeScreen}
        options={{
          title: "Live Transcription (v0.1)",
          tabBarLabel: "Live",
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "History",
          tabBarLabel: "History",
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root navigator with auth protection
 */
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return user ? <MainStack /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

