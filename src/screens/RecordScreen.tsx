import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { RecordButton } from "../components/RecordButton";
import { StatusText } from "../components/StatusText";
import { SessionIndicator } from "../components/SessionIndicator";
import { uploadAndTranscribeAsync } from "../api/transcription";
import { sessionService } from "../services/sessionService";
import { Session } from "../types/supabase";

/**
 * RecordScreen: One-shot "Record & Transcribe" flow
 */
export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDurationMillis, setRecordingDurationMillis] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Ready to record");
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [chunkIndex, setChunkIndex] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio mode and load session on mount
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Load current session
        const { data: session } = await sessionService.getCurrentSession();
        setCurrentSession(session);
        
        // Load existing transcript chunks if session exists
        if (session) {
          const { data: chunks } = await sessionService.getSessionChunks(session.id);
          if (chunks && chunks.length > 0) {
            const existingTranscript = chunks.map(chunk => chunk.transcript_text).join(" ");
            setTranscript(existingTranscript);
            // Set chunk index to the next available index
            const maxIndex = Math.max(...chunks.map(chunk => chunk.chunk_index));
            setChunkIndex(maxIndex + 1);
          } else {
            setChunkIndex(0);
          }
        } else {
          setChunkIndex(0);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    })();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update recording duration while recording
  useEffect(() => {
    if (isRecording && recording) {
      intervalRef.current = setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          if (status.isLoaded) {
            setRecordingDurationMillis(status.durationMillis || 0);
          }
        } catch (error) {
          console.error("Error getting recording status:", error);
        }
      }, 100); // Update every 100ms
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, recording]);

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Microphone permission is required to record audio."
        );
        return;
      }

      // Get or create session
      const { data: session, error: sessionError } =
        await sessionService.getOrCreateSession("single_record");

      if (sessionError) {
        Alert.alert("Error", "Failed to create session. Please try again.");
        return;
      }

      setCurrentSession(session);

      // Prepare recording options
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDurationMillis(0);
      setStatusMessage("Recording...");
      // Don't clear transcript - keep it visible until new session
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
      setStatusMessage("Error starting recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop and unload recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        throw new Error("Recording URI not available");
      }

      setStatusMessage("Uploading...");
      setIsTranscribing(true);

      // Upload and transcribe
      const text = await uploadAndTranscribeAsync(uri);

      // Append new transcript to existing transcript
      setTranscript((prev) => {
        const separator = prev ? " " : "";
        return prev + separator + text;
      });
      setStatusMessage("Done");

      // Save to session if we have one
      if (currentSession) {
        const currentChunkIndex = chunkIndex;
        const { error: chunkError } = await sessionService.addChunkToSession(
          currentSession.id,
          text,
          recordingDurationMillis,
          currentChunkIndex
        );

        if (chunkError) {
          console.error("Failed to save chunk:", chunkError);
        } else {
          // Increment chunk index for next recording
          setChunkIndex(currentChunkIndex + 1);
        }
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to transcribe audio";
      setStatusMessage(`Error: ${errorMessage}`);
      Alert.alert("Transcription Error", errorMessage);
    } finally {
      setIsTranscribing(false);
      setRecording(null);
    }
  };

  const handleButtonPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleNewSession = async () => {
    try {
      const { data: session, error } = await sessionService.createSession(
        "single_record"
      );

      if (error) {
        Alert.alert("Error", "Failed to create new session");
        return;
      }

      setCurrentSession(session);
      setTranscript(""); // Clear transcript only when new session is created
      setChunkIndex(0); // Reset chunk index for new session
      setStatusMessage("New session created");
    } catch (error) {
      console.error("Failed to create session:", error);
      Alert.alert("Error", "Failed to create new session");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SessionIndicator
          session={currentSession}
          onNewSession={handleNewSession}
        />

        <View style={styles.recordingSection}>
          <RecordButton
            label={isRecording ? "Stop Recording" : "Start Recording"}
            onPress={handleButtonPress}
            disabled={isTranscribing}
            loading={isTranscribing}
          />

          {isRecording && (
            <Text style={styles.timer}>{formatTime(recordingDurationMillis)}</Text>
          )}

          <StatusText
            message={statusMessage}
            isError={statusMessage.startsWith("Error")}
          />
        </View>

        {(transcript || currentSession) ? (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>Transcript:</Text>
            <ScrollView style={styles.transcriptScroll}>
              <Text style={styles.transcriptText}>
                {transcript || "No transcript yet. Start recording to transcribe."}
              </Text>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
    color: "#000",
  },
  recordingSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  timer: {
    fontSize: 32,
    fontWeight: "600",
    color: "#FF3B00",
    marginTop: 20,
    marginBottom: 10,
  },
  transcriptContainer: {
    flex: 1,
    marginTop: 20,
  },
  transcriptLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#000",
  },
  transcriptScroll: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});


