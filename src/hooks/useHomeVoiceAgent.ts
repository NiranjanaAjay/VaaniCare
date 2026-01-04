/**
 * Hook for using Gemini Live Voice Agent on HomePage
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  geminiLiveAgent,
  type AgentStatus,
  type VoiceAgentCallbacks,
} from "../services/geminiLiveAgent";
import type { ServiceDomain } from "../types";

interface UseHomeVoiceAgentOptions {
  apiKey: string;
  autoStart?: boolean;
}

interface UseHomeVoiceAgentReturn {
  status: AgentStatus;
  agentMessage: string;
  userTranscript: string;
  error: string | null;
  isReady: boolean;
  startAgent: () => Promise<void>;
  stopAgent: () => void;
}

export function useHomeVoiceAgent(
  options: UseHomeVoiceAgentOptions,
): UseHomeVoiceAgentReturn {
  const { apiKey, autoStart = true } = options;
  const navigate = useNavigate();

  const [status, setStatus] = useState<AgentStatus>("idle");
  const [agentMessage, setAgentMessage] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isInitialized = useRef(false);
  const hasStarted = useRef(false);

  // Initialize the agent
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      if (!apiKey) {
        setError(
          "API key is required. Please set VITE_GEMINI_API_KEY in your .env file.",
        );
        return;
      }

      const success = await geminiLiveAgent.initialize(apiKey);
      if (success) {
        setIsReady(true);
        setError(null);
      } else {
        setError("Failed to initialize voice agent");
      }
    };

    init();

    return () => {
      geminiLiveAgent.stop();
    };
  }, [apiKey]);

  // Handle service detection - navigate to the appropriate page
  const handleServiceDetected = useCallback(
    (service: ServiceDomain, details: Record<string, unknown>) => {
      console.log("=== Service Detected - Navigating ===");
      console.log("Service:", service);
      console.log("Details:", details);
      console.log("=====================================");

      // Stop the agent before navigating
      geminiLiveAgent.stop();

      // Small delay to let the confirmation message finish
      setTimeout(() => {
        navigate(`/conversation/${service}`, {
          state: {
            fromVoiceAgent: true,
            language: details.language,
            userRequest: details.userRequest,
            conversationHistory: details.conversationHistory,
          },
        });
      }, 2000);
    },
    [navigate],
  );

  // Start the voice agent
  const startAgent = useCallback(async () => {
    if (!isReady || hasStarted.current) return;
    hasStarted.current = true;

    setError(null);

    const callbacks: VoiceAgentCallbacks = {
      onAgentSpeaking: (text) => {
        setAgentMessage(text);
        console.log("Agent:", text);
      },
      onUserSpeech: (transcript) => {
        setUserTranscript(transcript);
        console.log("User:", transcript);
      },
      onServiceDetected: handleServiceDetected,
      onError: (err) => {
        setError(err);
        console.error("Voice agent error:", err);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        console.log("Status:", newStatus);
      },
    };

    try {
      await geminiLiveAgent.start(callbacks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start voice agent",
      );
      hasStarted.current = false;
    }
  }, [isReady, handleServiceDetected]);

  // Auto-start when ready
  useEffect(() => {
    if (autoStart && isReady && !hasStarted.current) {
      startAgent();
    }
  }, [autoStart, isReady, startAgent]);

  // Stop the agent
  const stopAgent = useCallback(() => {
    geminiLiveAgent.stop();
    hasStarted.current = false;
    setStatus("idle");
  }, []);

  return {
    status,
    agentMessage,
    userTranscript,
    error,
    isReady,
    startAgent,
    stopAgent,
  };
}
