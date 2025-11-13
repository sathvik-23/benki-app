import { supabase } from "../config/supabase";
import { Session, SessionType } from "../types/supabase";

/**
 * Session service for managing recording sessions
 */
export const sessionService = {
  /**
   * Create a new session
   */
  async createSession(
    type: SessionType,
    title?: string
  ): Promise<{ data: Session | null; error: Error | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: new Error("User not authenticated") };
      }

      // Complete any existing active sessions for this user
      await this.completeAllActiveSessions(user.id);

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          session_type: type,
          status: "active",
          title: title || null,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error as Error };
      }

      return { data: data as Session, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get the current active session for the user
   */
  async getCurrentSession(): Promise<{ data: Session | null; error: Error | null }> {
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
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No active session found
          return { data: null, error: null };
        }
        return { data: null, error: error as Error };
      }

      return { data: data as Session, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get or create current session
   */
  async getOrCreateSession(
    type: SessionType
  ): Promise<{ data: Session | null; error: Error | null }> {
    const { data: currentSession, error: getError } = await this.getCurrentSession();

    if (getError) {
      return { data: null, error: getError };
    }

    if (currentSession) {
      return { data: currentSession, error: null };
    }

    return await this.createSession(type);
  },

  /**
   * Complete a session
   */
  async completeSession(sessionId: string): Promise<{ error: Error | null }> {
    try {
      // Calculate total duration from chunks
      const { data: chunks } = await supabase
        .from("transcription_chunks")
        .select("duration_ms")
        .eq("session_id", sessionId);

      const totalDuration = chunks?.reduce((sum, chunk) => {
        return sum + (chunk.duration_ms || 0);
      }, 0);

      const { error } = await supabase
        .from("sessions")
        .update({
          status: "completed",
          total_duration_ms: totalDuration || null,
        })
        .eq("id", sessionId);

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  /**
   * Complete all active sessions for a user
   */
  async completeAllActiveSessions(userId: string): Promise<void> {
    try {
      const { data: activeSessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active");

      if (activeSessions && activeSessions.length > 0) {
        await Promise.all(
          activeSessions.map((session) => this.completeSession(session.id))
        );
      }
    } catch (error) {
      console.error("Error completing active sessions:", error);
      // Don't throw - allow new session creation even if cleanup fails
    }
  },

  /**
   * Get transcription chunks for a session
   */
  async getSessionChunks(
    sessionId: string
  ): Promise<{ data: { transcript_text: string; chunk_index: number }[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("transcription_chunks")
        .select("transcript_text, chunk_index")
        .eq("session_id", sessionId)
        .order("chunk_index", { ascending: true });

      if (error) {
        return { data: null, error: error as Error };
      }

      return { data: data as { transcript_text: string; chunk_index: number }[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Add a transcription chunk to a session
   */
  async addChunkToSession(
    sessionId: string,
    transcriptText: string,
    durationMs: number | null,
    chunkIndex: number
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from("transcription_chunks").insert({
        session_id: sessionId,
        chunk_index: chunkIndex,
        transcript_text: transcriptText,
        duration_ms: durationMs,
      });

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
};
