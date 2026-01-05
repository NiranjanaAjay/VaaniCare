// Groq TTS Service for Malayalam speech synthesis
// Uses Groq's text-to-speech API for better language support

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

interface GroqTTSOptions {
  text: string;
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

class GroqTTSService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  constructor() {
    // Initialize AudioContext lazily to handle browser autoplay policies
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    }
    return this.audioContext;
  }

  async speak(options: GroqTTSOptions): Promise<void> {
    const { text, onStart, onEnd, onError } = options;

    if (!text) {
      onError?.("No text provided");
      return;
    }

    if (!GROQ_API_KEY) {
      console.warn("⚠️ Groq API key not found, falling back to browser TTS");
      onError?.("Groq API key not configured");
      return;
    }

    // Stop any currently playing audio
    this.stop();

    try {
      onStart?.();
      this.isPlaying = true;

      console.log(
        "🎤 Groq TTS: Generating Malayalam speech for:",
        text.substring(0, 50) + "...",
      );

      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/speech",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "playai-tts",
            input: text,
            voice: "Arista-PlayAI", // Good for Indian languages
            response_format: "mp3",
            speed: 0.9, // Slightly slower for elderly users
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Groq TTS Error:", response.status, errorText);
        throw new Error(`Groq TTS failed: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();

      const audioContext = this.getAudioContext();

      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      this.currentSource = audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(audioContext.destination);

      this.currentSource.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        console.log("✅ Groq TTS: Finished speaking");
        onEnd?.();
      };

      this.currentSource.start(0);
      console.log("🔊 Groq TTS: Playing audio");
    } catch (error) {
      this.isPlaying = false;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Groq TTS Error:", errorMessage);
      onError?.(errorMessage);
    }
  }

  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // Ignore errors when stopping already stopped source
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Singleton instance
export const groqTTS = new GroqTTSService();
