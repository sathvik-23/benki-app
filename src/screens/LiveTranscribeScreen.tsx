import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { RecordButton } from "../components/RecordButton";
import { StatusText } from "../components/StatusText";
import { SessionIndicator } from "../components/SessionIndicator";
import { uploadAndTranscribeAsync } from "../api/transcription";
import { sessionService } from "../services/sessionService";
import { Session } from "../types/supabase";

const CHUNK_INTERVAL_MS = 5000; // 5 seconds per chunk

/**
 * LiveTranscribeScreen: Fake live transcription by chunked recording
 */
export default function LiveTranscribeScreen() {
  const [isLive, setIsLive] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Audio.Recording | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready to start live transcription");
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [chunkCount, setChunkCount] = useState(0);

  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptScrollRef = useRef<ScrollView | null>(null);
  const currentRecordingRef = useRef<Audio.Recording | null>(null);
  const chunkIndexRef = useRef<number>(0);

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
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    })();

    // Cleanup on unmount
    return () => {
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
      }
      if (currentRecordingRef.current) {
        currentRecordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  // Auto-scroll transcript to bottom when new text is added
  useEffect(() => {
    if (liveTranscript && transcriptScrollRef.current) {
      setTimeout(() => {
        transcriptScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [liveTranscript]);

  const startRecordingChunk = async (): Promise<Audio.Recording> => {
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    return recording;
  };

  const processChunk = async (recording: Audio.Recording, chunkIndex: number) => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        throw new Error("Recording URI not available");
      }

      setIsProcessingChunk(true);
      setStatusMessage("Transcribing chunk...");

      // Get duration
      const status = await recording.getStatusAsync();
      const durationMs = status.isLoaded ? status.durationMillis : null;

      // Upload and transcribe chunk
      const text = await uploadAndTranscribeAsync(uri);

      // Append to live transcript
      setLiveTranscript((prev) => {
        const separator = prev ? " " : "";
        return prev + separator + text;
      });

      // Save to session
      if (currentSession) {
        const { error: chunkError } = await sessionService.addChunkToSession(
          currentSession.id,
          text,
          durationMs,
          chunkIndex
        );

        if (chunkError) {
          console.error("Failed to save chunk:", chunkError);
        } else {
          setChunkCount((prev) => prev + 1);
        }
      }

      setStatusMessage("Listening...");
    } catch (error) {
      console.error("Error processing chunk:", error);
      setLiveTranscript((prev) => {
        const separator = prev ? " " : "";
        return prev + separator + "[error in chunk]";
      });
      setStatusMessage("Error in chunk, continuing...");
    } finally {
      setIsProcessingChunk(false);
    }
  };

  const startLive = async () => {
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
        await sessionService.getOrCreateSession("live_transcription");

      if (sessionError) {
        Alert.alert("Error", "Failed to create session. Please try again.");
        return;
      }

      setCurrentSession(session);
      chunkIndexRef.current = 0;
      setChunkCount(0);

      // Initialize audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start first recording chunk
      const firstRecording = await startRecordingChunk();
      setCurrentRecording(firstRecording);
      currentRecordingRef.current = firstRecording;
      setIsLive(true);
      setLiveTranscript("");
      setStatusMessage("Listening...");

      // Start interval for chunk processing
      chunkIntervalRef.current = setInterval(async () => {
        const recordingToProcess = currentRecordingRef.current;
        const currentChunkIndex = chunkIndexRef.current;
        
        if (!recordingToProcess) {
          console.error("No recording to process");
          return;
        }
        
        // Increment chunk index for next chunk
        chunkIndexRef.current = currentChunkIndex + 1;
        
        // Start new recording immediately
        try {
          const newRecording = await startRecordingChunk();
          setCurrentRecording(newRecording);
          currentRecordingRef.current = newRecording;
        } catch (error) {
          console.error("Error starting new chunk:", error);
        }

        // Process the previous chunk in parallel
        processChunk(recordingToProcess, currentChunkIndex).catch(console.error);
      }, CHUNK_INTERVAL_MS);
    } catch (error) {
      console.error("Failed to start live transcription:", error);
      Alert.alert("Error", "Failed to start live transcription. Please try again.");
      setStatusMessage("Error starting live transcription");
    }
  };

  const stopLive = async () => {
    try {
      // Clear interval
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      setIsLive(false);
      setStatusMessage("Stopping...");

      // Process final chunk if exists and has duration > 0
      const finalRecording = currentRecordingRef.current;
      if (finalRecording) {
        try {
          const status = await finalRecording.getStatusAsync();
          if (status.isLoaded && status.durationMillis && status.durationMillis > 500) {
            // Only process if chunk is at least 500ms
            await processChunk(finalRecording, chunkIndexRef.current);
          } else {
            await finalRecording.stopAndUnloadAsync();
          }
        } catch (error) {
          console.error("Error processing final chunk:", error);
          await finalRecording.stopAndUnloadAsync().catch(console.error);
        }
      }

      // Complete session
      if (currentSession) {
        await sessionService.completeSession(currentSession.id);
      }

      setStatusMessage("Stopped");
      setCurrentRecording(null);
      currentRecordingRef.current = null;
    } catch (error) {
      console.error("Error stopping live transcription:", error);
      setStatusMessage("Error stopping");
    }
  };

  const handleNewSession = async () => {
    try {
      // Stop live if running
      if (isLive) {
        await stopLive();
      }

      const { data: session, error } = await sessionService.createSession(
        "live_transcription"
      );

      if (error) {
        Alert.alert("Error", "Failed to create new session");
        return;
      }

      setCurrentSession(session);
      setLiveTranscript("");
      setChunkCount(0);
      chunkIndexRef.current = 0;
      setStatusMessage("New session created");
    } catch (error) {
      console.error("Failed to create session:", error);
      Alert.alert("Error", "Failed to create new session");
    }
  };

  const handleButtonPress = () => {
    if (isLive) {
      stopLive();
    } else {
      startLive();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Live Transcription (v0.1)</Text>

        <SessionIndicator
          session={currentSession}
          onNewSession={handleNewSession}
          chunkCount={chunkCount}
        />

        <View style={styles.controlsSection}>
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          <RecordButton
            label={isLive ? "Stop Live" : "Start Live"}
            onPress={handleButtonPress}
            disabled={isProcessingChunk}
            loading={isProcessingChunk}
          />

          <StatusText
            message={statusMessage}
            isError={statusMessage.startsWith("Error")}
          />
        </View>

        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>
            {isLive ? "Live Transcript:" : "Transcript:"}
          </Text>
          <ScrollView
            ref={transcriptScrollRef}
            style={styles.transcriptScroll}
            contentContainerStyle={styles.transcriptContent}
          >
            <Text style={styles.transcriptText}>
              {liveTranscript || (isLive ? "Waiting for audio..." : "No transcript yet")}
            </Text>
          </ScrollView>
        </View>
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
    marginBottom: 20,
    color: "#000",
  },
  controlsSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffebee",
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d32f2f",
    marginRight: 6,
  },
  liveText: {
    color: "#d32f2f",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 1,
  },
  transcriptContainer: {
    flex: 1,
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
  },
  transcriptContent: {
    padding: 16,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});

