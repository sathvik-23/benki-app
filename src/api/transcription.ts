import * as FileSystem from "expo-file-system/legacy";
import { API_CONFIG } from "../config/apiConfig";

/**
 * Transcribes an audio file using OpenAI Whisper API.
 * 
 * @param uri - The local file URI of the audio file (from expo-av recording)
 * @returns Promise<string> - The transcribed text
 * @throws Error if the request fails or returns a non-2xx status
 */
export async function uploadAndTranscribeAsync(uri: string): Promise<string> {
  try {
    // Check if API key is configured
    if (!API_CONFIG.OPENAI_API_KEY || API_CONFIG.OPENAI_API_KEY === "your_openai_api_key_here") {
      throw new Error(
        "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local file."
      );
    }

    // Read file info to verify it exists using legacy API
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("Audio file not found");
    }

    // Get filename from URI or use default
    const filename = uri.split("/").pop() || "recording.m4a";
    
    // Determine file extension and MIME type
    const extension = filename.split(".").pop()?.toLowerCase() || "m4a";
    const mimeType = 
      extension === "m4a" ? "audio/m4a" :
      extension === "mp3" ? "audio/mpeg" :
      extension === "wav" ? "audio/wav" :
      extension === "webm" ? "audio/webm" :
      "audio/m4a"; // Default

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Append file to FormData
    // @ts-ignore - FormData.append with file URI works in React Native
    formData.append("file", {
      uri,
      type: mimeType,
      name: filename,
    } as any);

    // Append model parameter (Whisper-1)
    formData.append("model", API_CONFIG.WHISPER_MODEL);

    // Make POST request to OpenAI Whisper API
    const response = await fetch(API_CONFIG.OPENAI_API_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${API_CONFIG.OPENAI_API_KEY}`,
        // Don't set Content-Type header - let fetch set it with boundary for multipart/form-data
      },
    });

    // Check if response is OK
    if (!response.ok) {
      let errorMessage = `Transcription failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } catch {
        // If JSON parsing fails, use the default error message
      }
      throw new Error(errorMessage);
    }

    // Parse JSON response
    const data = await response.json();
    
    // Extract text field from response
    if (typeof data.text !== "string") {
      throw new Error("Invalid response format: missing 'text' field");
    }

    return data.text;
  } catch (error) {
    // Re-throw with friendly message
    if (error instanceof Error) {
      // Don't wrap if it's already a user-friendly error
      if (error.message.includes("API key not configured") || 
          error.message.includes("Audio file not found")) {
        throw error;
      }
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
    throw new Error("Failed to transcribe audio: Unknown error");
  }
}

