import { supabase } from "../config/supabase";
import { Session, SessionWithChunks } from "../types/supabase";

/**
 * History service for managing session history
 */
export const historyService = {
  /**
   * Get user sessions with pagination
   */
  async getUserSessions(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: Session[] | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error: error as Error };
      }

      return { data: data as Session[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get full transcript for a session
   */
  async getSessionTranscript(
    sessionId: string
  ): Promise<{ data: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc("get_full_transcript", {
        session_uuid: sessionId,
      });

      if (error) {
        // Fallback: manually concatenate if function doesn't exist
        const { data: chunks, error: chunksError } = await supabase
          .from("transcription_chunks")
          .select("transcript_text, chunk_index")
          .eq("session_id", sessionId)
          .order("chunk_index", { ascending: true });

        if (chunksError) {
          return { data: null, error: chunksError as Error };
        }

        const transcript = chunks
          ?.map((chunk) => chunk.transcript_text)
          .join(" ") || "";

        return { data: transcript, error: null };
      }

      return { data: data as string, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get session with full details including chunks
   */
  async getSessionWithChunks(
    sessionId: string
  ): Promise<{ data: SessionWithChunks | null; error: Error | null }> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) {
        return { data: null, error: sessionError as Error };
      }

      const { data: transcript, error: transcriptError } =
        await this.getSessionTranscript(sessionId);

      if (transcriptError) {
        return { data: null, error: transcriptError };
      }

      return {
        data: {
          ...(session as Session),
          full_transcript: transcript || "",
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Delete a session and all its chunks
   */
  async deleteSession(sessionId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from("sessions").delete().eq("id", sessionId);

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
};

