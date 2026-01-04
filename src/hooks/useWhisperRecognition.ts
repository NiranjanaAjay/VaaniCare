import { useState, useRef, useCallback } from 'react';

interface UseWhisperRecognitionOptions {
    onResult: (text: string) => void;
    lang?: string;
}

export function useWhisperRecognition({ onResult }: UseWhisperRecognitionOptions) {
    const [isListening, setIsListening] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startListening = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'audio.webm');

                try {
                    const response = await fetch('http://127.0.0.1:8000/transcribe', {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.text) {
                            onResult(data.text);
                        }
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                } finally {
                    setIsListening(false);
                    // Stop all tracks to release mic
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (error) {
            console.error('Mic access error:', error);
        }
    }, [onResult]);

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
        }
    }, [isListening]);

    return {
        isListening,
        startListening,
        stopListening
    };
}
