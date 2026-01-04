import { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { VoiceIndicator } from '@/components/VoiceButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/TranslationContext';
import { useWhisperRecognition } from '@/hooks/useWhisperRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import {
  Send,
  Mic,
  Volume2,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GovernmentScreenProps {
  onBack: () => void;
}

interface Scheme {
  title: string;
  url: string;
  snippet: string;
  source_query: string;
}

interface SchemeResponse {
  query_state: string;
  count: number;
  schemes: Scheme[];
  disclaimer: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'schemes';
  data?: SchemeResponse;
}

interface UserData {
  age: string;
  gender: string;
  state: string;
  income_bracket: string;
  occupation: string;
  category: string;
}

const QUESTIONS = [
  { key: 'age', en: "What is your age?", ml: "നിങ്ങളുടെ പ്രായം എത്രയാണ്?" },
  { key: 'gender', en: "What is your gender?", ml: "നിങ്ങളുടെ ലിംഗഭേദം ഏതാണ്?" },
  { key: 'state', en: "Which state do you live in?", ml: "നിങ്ങൾ ഏത് സംസ്ഥാനത്താണ് താമസിക്കുന്നത്?" },
  { key: 'income_bracket', en: "What is your annual income bracket?", ml: "നിങ്ങളുടെ വാർഷിക വരുമാന പരിധി എത്രയാണ്?" },
  { key: 'occupation', en: "What is your occupation?", ml: "നിങ്ങളുടെ ജോലി എന്താണ്?" },
  { key: 'category', en: "Which social category do you belong to (e.g., General, OBC, SC, ST)?", ml: "നിങ്ങൾ ഏത് വിഭാഗത്തിലാണ് ഉൾപ്പെടുന്നത് (ഉദാഹരണത്തിന്: ജനറൽ, ഒബിസി, എസ്‌സി, എസ്‌ടി)?" },
];

export function GovernmentScreen({ onBack }: GovernmentScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 means initial state
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldListenAfterSpeakRef = useRef(true);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { isListening, startListening, stopListening } = useWhisperRecognition({
    onResult: (text) => {
      handleMessageSubmit(text);
    }
  });

  const { speak, isSpeaking } = useSpeechSynthesis({
    language: currentLanguage,
    rate: 0.9,
    onEnd: () => {
      if (shouldListenAfterSpeakRef.current && currentQuestionIndex < QUESTIONS.length) {
        setTimeout(() => startListening(), 500);
      }
    }
  });

  const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'schemes' = 'text', data?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      type,
      data
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const askNextQuestion = (index: number, currentData?: Partial<UserData>) => {
    // Add a slight delay before the assistant speaks to make it more natural
    setTimeout(() => {
      if (index < QUESTIONS.length) {
        const question = QUESTIONS[index];
        const text = currentLanguage === 'ml' ? question.ml : question.en;
        addMessage('assistant', text);
        speak(text);
        setCurrentQuestionIndex(index);
        setIsProcessing(false);
      } else {
        // All questions answered, fetch schemes
        performFindSchemes(currentData || userData);
      }
    }, 1500);
  };

  const handleMessageSubmit = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    addMessage('user', text);
    setInputText('');

    // Update userData based on current question
    if (currentQuestionIndex >= 0 && currentQuestionIndex < QUESTIONS.length) {
      const field = QUESTIONS[currentQuestionIndex].key;
      const updatedData = { ...userData, [field]: text };
      setUserData(updatedData);

      // Move to next question logic with the updated data
      askNextQuestion(currentQuestionIndex + 1, updatedData);
    } else {
      setIsProcessing(false);
    }
  };

  const performFindSchemes = async (profileData: Partial<UserData>) => {
    setIsProcessing(true);
    const loadingMsg = currentLanguage === 'ml'
      ? "നിങ്ങൾക്കായി ഏറ്റവും അനുയോജ്യമായ പദ്ധതികൾ ഞാൻ കണ്ടെത്തുകയാണ്..."
      : "I'm finding the best schemes for you...";
    addMessage('assistant', loadingMsg);
    speak(loadingMsg);

    try {
      const response = await fetch('http://127.0.0.1:8000/find-schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error('Failed to fetch schemes');

      const result: SchemeResponse = await response.json();

      const successMsg = currentLanguage === 'ml'
        ? `${result.count} പദ്ധതികൾ കണ്ടെത്തി.`
        : `Found ${result.count} schemes for you.`;

      addMessage('assistant', successMsg, 'schemes', result);
      speak(successMsg);
    } catch (error) {
      console.error('Error finding schemes:', error);
      const errorMsg = currentLanguage === 'ml'
        ? "ക്ഷമിക്കണം, പദ്ധതികൾ കണ്ടെത്തുന്നതിൽ ഒരു പിശക് സംഭവിച്ചു. ദയവായി പിന്നീട് ശ്രമിക്കുക."
        : "Sorry, I encountered an error while finding schemes. Please try again later.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
      setCurrentQuestionIndex(QUESTIONS.length); // End of flow
    }
  };

  // Initial prompt
  useEffect(() => {
    // Reset conversation if language changes or on mount
    setMessages([]);
    setUserData({});
    setCurrentQuestionIndex(-1);

    const timer = setTimeout(() => {
      const welcome = currentLanguage === 'ml'
        ? "നമസ്കാരം! നിങ്ങൾക്ക് അനുയോജ്യമായ സർക്കാർ പദ്ധതികൾ കണ്ടെത്താൻ ഞാൻ സഹായിക്കാം. കുറച്ച് വിവരങ്ങൾ നൽകുക."
        : "Hello! I can help you find suitable government schemes. Please provide some details.";
      addMessage('assistant', welcome);

      // We'll use a local variable to ensure we don't have race conditions with state
      speak(welcome);

      // Increased delay to 6 seconds for the long welcome message in Malayalam
      const questionTimer = setTimeout(() => {
        askNextQuestion(0);
      }, currentLanguage === 'ml' ? 6000 : 4000);

      return () => clearTimeout(questionTimer);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        title={t('services.government.name')}
        showBack
        onBack={() => {
          shouldListenAfterSpeakRef.current = false;
          stopListening();
          onBack();
        }}
      />

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full mb-4",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] rounded-2xl p-4 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2",
              msg.role === 'user'
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-muted text-foreground rounded-tl-none border"
            )}>
              {msg.type === 'schemes' && msg.data ? (
                <div className="space-y-4">
                  <p className="font-semibold text-lg border-bottom pb-2 mb-2 border-primary/20">{msg.content}</p>
                  <div className="grid gap-4">
                    {msg.data.schemes.map((scheme, idx) => (
                      <Card key={idx} className="overflow-hidden border-primary/20 hover:border-primary transition-colors">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg text-primary flex items-start gap-2">
                            <span className="mt-1 shrink-0"><ChevronRight className="w-4 h-4" /></span>
                            {scheme.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {scheme.snippet}
                          </p>
                          <a
                            href={scheme.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                          >
                            {currentLanguage === 'ml' ? 'വിവരങ്ങൾ കാണുക' : 'View Details'} <ExternalLink className="w-3 h-3" />
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {msg.data.disclaimer && (
                    <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg mt-2 text-xs text-blue-800 dark:text-blue-200">
                      <Info className="w-4 h-4 shrink-0" />
                      <p>{msg.data.disclaimer}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-lg leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full transition-all duration-300",
              isListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" :
                isSpeaking ? "bg-green-500 hover:bg-green-600 text-white" :
                  "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            onClick={isListening ? stopListening : () => startListening()}
            disabled={isProcessing && !isListening}
          >
            {isSpeaking ? (
              <Volume2 className="h-6 w-6 animate-pulse" />
            ) : (
              <Mic className={cn("h-6 w-6", isListening && "animate-bounce")} />
            )}
          </Button>

          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleMessageSubmit(inputText)}
              placeholder={isListening ? (currentLanguage === 'ml' ? "ശ്രദ്ധിക്കുന്നു..." : "Listening...") : (currentLanguage === 'ml' ? "മറുപടി ടൈപ്പ് ചെയ്യുക..." : "Type your answer...")}
              className="h-14 rounded-2xl pr-12 text-lg shadow-inner bg-muted/50 border-none focus-visible:ring-primary/20"
              disabled={isProcessing}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-primary hover:bg-primary/10 rounded-xl"
              onClick={() => handleMessageSubmit(inputText)}
              disabled={isProcessing || !inputText.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 text-center">
          <VoiceIndicator isActive={isListening || isSpeaking} />
        </div>
      </div>
    </div>
  );
}
