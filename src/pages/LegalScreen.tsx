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
  Scale,
  Phone,
  Bot,
  UserRound,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalScreenProps {
  onBack: () => void;
}

interface Lawyer {
  title: string;
  url: string;
  snippet: string;
}

interface LegalResponse {
  issue: string;
  location: string;
  count: number;
  results: Lawyer[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'results' | 'advice';
  data?: any;
}

type Mode = 'select' | 'lawyer' | 'ai';

const QUESTIONS = {
  lawyer: [
    { key: 'issue', en: "What legal issue or problem are you facing?", ml: "നിങ്ങൾ നേരിടുന്ന നിയമപരമായ പ്രശ്നം എന്താണ്?" },
    { key: 'location', en: "In which location (city or district) are you looking for legal help?", ml: "നിങ്ങൾ ഏത് സ്ഥലത്താണ് (നഗരം അല്ലെങ്കിൽ ജില്ല) നിയമ സഹായം തിരയുന്നത്?" },
  ],
  ai: [
    { key: 'issue', en: "Please describe your legal issue in detail, and I'll provide AI-powered advice.", ml: "നിങ്ങളുടെ നിയമപരമായ പ്രശ്നം വിശദീകരിക്കുക, ഞാൻ നിങ്ങൾക്ക് വേണ്ട നിർദ്ദേശങ്ങൾ നൽകാം." },
  ]
};

export function LegalScreen({ onBack }: LegalScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<Mode>('select');
  const [queryData, setQueryData] = useState<any>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldListenAfterSpeakRef = useRef(true);

  useEffect(() => {
    if (mode !== 'select') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, mode]);

  const { isListening, startListening, stopListening } = useWhisperRecognition({
    onResult: (text) => {
      handleMessageSubmit(text);
    }
  });

  const { speak, isSpeaking } = useSpeechSynthesis({
    language: currentLanguage,
    rate: 0.9,
    onEnd: () => {
      if (!shouldListenAfterSpeakRef.current) return;

      let shouldListen = false;
      if (mode === 'select') {
        shouldListen = true;
      } else if (mode === 'lawyer' || mode === 'ai') {
        if (currentQuestionIndex < QUESTIONS[mode].length) {
          shouldListen = true;
        }
      }

      if (shouldListen) {
        setTimeout(() => startListening(), 500);
      }
    }
  });

  const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'results' | 'advice' = 'text', data?: any) => {
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

  const handleSelection = (choice: Mode) => {
    setMode(choice);
    const welcomeText = choice === 'lawyer'
      ? (currentLanguage === 'ml' ? "ശരി, നമുക്ക് ഒരു വക്കീലിനെ കണ്ടെത്താം." : "Okay, let's find a lawyer for you.")
      : (currentLanguage === 'ml' ? "ശരി, ഞാൻ നിങ്ങൾക്ക് ആവശ്യമായ ഉപദേശം നൽകാം." : "Okay, I will provide the legal advice you need.");

    addMessage('assistant', welcomeText);
    speak(welcomeText);

    // After selection, we wait for the assistant to finish speaking the transition
    // before asking the first specific question.
    setTimeout(() => {
      askNextQuestion(0, choice);
    }, 2500);
  };

  const askNextQuestion = (index: number, currentMode: Mode, currentData?: any) => {
    if (currentMode === 'select') return;

    const questions = QUESTIONS[currentMode];
    setTimeout(() => {
      if (index < questions.length) {
        const question = questions[index];
        const text = currentLanguage === 'ml' ? question.ml : question.en;
        addMessage('assistant', text);
        speak(text);
        setCurrentQuestionIndex(index);
        setIsProcessing(false);
      } else {
        if (currentMode === 'lawyer') {
          performFindLawyers(currentData || queryData);
        } else {
          performGetAIAdvice(currentData || queryData);
        }
      }
    }, 1000);
  };

  const handleMessageSubmit = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    if (mode === 'select') {
      const normalized = text.toLowerCase().trim();

      // Ignore very short transcriptions (noise/filler) to prevent jumping or retries
      if (normalized.length < 3) return;

      const capturesLawyer = normalized.includes('lawyer') || normalized.includes('vakkil') || normalized.includes('വക്കീൽ') ||
        normalized.includes('find') || normalized.includes('കാണണം');
      const capturesAI = normalized.includes('ai') || normalized.includes('advice') || normalized.includes('ഉപദേശം') ||
        normalized.includes('ask') || normalized.includes('ചോദിക്കണം');

      if (capturesLawyer && !capturesAI) {
        handleSelection('lawyer');
        return;
      } else if (capturesAI && !capturesLawyer) {
        handleSelection('ai');
        return;
      }

      // Only add to chat and retry if it seems like a real sentence
      if (normalized.length > 10) {
        addMessage('user', text);
        const retryText = currentLanguage === 'ml'
          ? "ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല. നിങ്ങൾക്ക് ഒരു വക്കീലിനെ കണ്ടെത്തണോ അതോ എഐ ഉപദേശം വേണോ?"
          : "Sorry, I didn't quite get that. Would you like to find a lawyer or get AI advice?";
        addMessage('assistant', retryText);
        speak(retryText);
      }
      return;
    }

    setIsProcessing(true);
    addMessage('user', text);
    setInputText('');

    const questions = QUESTIONS[mode];
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const field = questions[currentQuestionIndex].key;
      const updatedData = { ...queryData, [field]: text };
      setQueryData(updatedData);
      askNextQuestion(currentQuestionIndex + 1, mode, updatedData);
    } else {
      setIsProcessing(false);
    }
  };

  const performFindLawyers = async (data: any) => {
    setIsProcessing(true);
    const loadingMsg = currentLanguage === 'ml'
      ? `${data.location} അതിൽ ${data.issue} സംബന്ധിച്ച നിയമ വിദഗ്ധരെ ഞാൻ തിരയുകയാണ്...`
      : `I'm searching for legal advisors for ${data.issue} in ${data.location}...`;
    addMessage('assistant', loadingMsg);
    speak(loadingMsg);

    try {
      const response = await fetch('http://127.0.0.1:8000/find-lawyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to fetch layers');

      const result: LegalResponse = await response.json();
      const successMsg = currentLanguage === 'ml'
        ? `${result.count} നിയമ വിദഗ്ധരെ കണ്ടെത്തി.`
        : `Found ${result.count} legal advisors for you.`;

      addMessage('assistant', successMsg, 'results', result);
      speak(successMsg);
    } catch (error) {
      console.error('Error finding lawyers:', error);
      const errorMsg = currentLanguage === 'ml'
        ? "ക്ഷമിക്കണം, വിവരങ്ങൾ കണ്ടെത്തുന്നതിൽ ഒരു പിശക് സംഭവിച്ചു. ദയവായി പിന്നീട് ശ്രമിക്കുക."
        : "Sorry, I encountered an error while finding legal help. Please try again later.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
      setCurrentQuestionIndex(QUESTIONS.lawyer.length);
    }
  };

  const performGetAIAdvice = async (data: any) => {
    setIsProcessing(true);
    const loadingMsg = currentLanguage === 'ml'
      ? "ഞാൻ ആലോചിക്കുകയാണ്, ഒരു നിമിഷം..."
      : "Let me think about that for a moment...";
    addMessage('assistant', loadingMsg);
    speak(loadingMsg);

    try {
      const response = await fetch('http://127.0.0.1:8000/legal-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: data.issue,
          language: currentLanguage
        })
      });

      if (!response.ok) throw new Error('Failed to fetch advice');

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      addMessage('assistant', result.advice, 'advice');
      speak(result.advice);
    } catch (error) {
      console.error('Error getting AI advice:', error);
      const errorMsg = currentLanguage === 'ml'
        ? "ക്ഷമിക്കണം, ഉപദേശം ലഭ്യമാക്കുന്നതിൽ ഒരു പിശക് സംഭവിച്ചു."
        : "Sorry, I encountered an error while getting AI advice.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
      setCurrentQuestionIndex(QUESTIONS.ai.length);
    }
  };

  useEffect(() => {
    setMessages([]);
    setQueryData({});
    setMode('select');
    setCurrentQuestionIndex(-1);

    const timer = setTimeout(() => {
      const welcome = currentLanguage === 'ml'
        ? "നമസ്കാരം! നിങ്ങൾക്ക് എങ്ങനെയാണ് നിയമ സഹായം വേണ്ടത്? ഒരു വക്കീലിനെ കണ്ടെത്തണോ അതോ ഇപ്പോൾ തന്നെ എന്നോട് ചോദിക്കണോ?"
        : "Hello! How can I help you with legal matters? Would you like to find a lawyer or ask me for advice right now?";
      addMessage('assistant', welcome);
      speak(welcome);
    }, 500); // Shorter delay for better responsiveness

    return () => clearTimeout(timer);
  }, [currentLanguage]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        title={t('services.legal.name')}
        showBack
        onBack={() => {
          shouldListenAfterSpeakRef.current = false;
          stopListening();
          onBack();
        }}
      />

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col justify-center items-center py-12 opacity-20">
            <Scale className="w-16 h-16 mb-4" />
            <p className="text-sm font-medium">VaaniCare Legal Assistant</p>
          </div>
        )}

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
                ? "bg-violet-600 text-white rounded-tr-none"
                : "bg-muted text-foreground rounded-tl-none border"
            )}>
              {msg.type === 'results' && msg.data ? (
                <div className="space-y-4">
                  <p className="font-semibold text-lg border-b pb-2 mb-2 border-violet-200 dark:border-violet-800">{msg.content}</p>
                  <div className="grid gap-4">
                    {msg.data.results.map((lawyer: any, idx: number) => (
                      <Card key={idx} className="overflow-hidden border-violet-100 hover:border-violet-300 transition-colors shadow-none bg-card/50">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg text-violet-700 dark:text-violet-400 flex items-start gap-2">
                            <span className="mt-1 shrink-0"><Scale className="w-4 h-4" /></span>
                            {lawyer.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {lawyer.snippet}
                          </p>
                          <a
                            href={lawyer.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:underline"
                          >
                            {currentLanguage === 'ml' ? 'വിവരങ്ങൾ കാണുക' : 'View Details'} <ExternalLink className="w-3 h-3" />
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
                    <p className="text-sm font-medium text-violet-800 dark:text-violet-200 mb-2">
                      {currentLanguage === 'ml' ? 'സൗജന്യ നിയമ സഹായത്തിന്:' : 'For free legal aid:'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-violet-600 border-violet-200"
                      onClick={() => window.location.href = 'tel:15100'}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {currentLanguage === 'ml' ? 'ഹെൽപ്പ്ലൈൻ: 15100' : 'Helpline: 15100'}
                    </Button>
                  </div>
                </div>
              ) : msg.type === 'advice' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 font-bold border-b pb-2 mb-2 border-violet-100 dark:border-violet-800">
                    <Bot className="w-5 h-5" />
                    <span>AI Legal Assistant</span>
                  </div>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {msg.role === 'assistant' && (
                    <div className="mt-1 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                      <Scale className="w-3 h-3 text-violet-600" />
                    </div>
                  )}
                  <p className="text-lg leading-relaxed">{msg.content}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {(mode === 'select' || currentQuestionIndex === -1) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both">
            <Card
              className={cn(
                "cursor-pointer transition-all active:scale-95 border-2",
                mode === 'lawyer' ? "border-violet-600 bg-violet-50/50 shadow-lg scale-105" : "border-violet-100 hover:border-violet-400 hover:shadow-md"
              )}
              onClick={() => mode === 'select' && handleSelection('lawyer')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", mode === 'lawyer' ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-600")}>
                  <UserRound className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{currentLanguage === 'ml' ? "വക്കീലിനെ കണ്ടെത്തുക" : "Find a Lawyer"}</p>
                  <p className="text-sm text-muted-foreground">{currentLanguage === 'ml' ? "സമീപത്തുള്ള അഭിഭാഷകർ" : "Local legal advisors"}</p>
                </div>
                <ArrowRight className={cn("w-5 h-5", mode === 'lawyer' ? "text-violet-600" : "text-violet-400")} />
              </CardContent>
            </Card>
            <Card
              className={cn(
                "cursor-pointer transition-all active:scale-95 border-2",
                mode === 'ai' ? "border-violet-600 bg-violet-50/50 shadow-lg scale-105" : "border-violet-100 hover:border-violet-400 hover:shadow-md"
              )}
              onClick={() => mode === 'select' && handleSelection('ai')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", mode === 'ai' ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-600")}>
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{currentLanguage === 'ml' ? "AI ഉപദേശം" : "AI Advice"}</p>
                  <p className="text-sm text-muted-foreground">{currentLanguage === 'ml' ? "പെട്ടെന്നുള്ള സഹായം" : "Instant guidance"}</p>
                </div>
                <ArrowRight className={cn("w-5 h-5", mode === 'ai' ? "text-violet-600" : "text-violet-400")} />
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full transition-all duration-300",
              isListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" :
                isSpeaking ? "bg-green-500 hover:bg-green-600 text-white" :
                  "bg-violet-100 text-violet-600 hover:bg-violet-200"
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
              placeholder={isListening ? (currentLanguage === 'ml' ? "ശ്രദ്ധിക്കുന്നു..." : "Listening...") : (currentLanguage === 'ml' ? "മറുപടി നൽകുക..." : "Type your reply...")}
              className="h-14 rounded-2xl pr-12 text-lg shadow-inner bg-muted/50 border-none focus-visible:ring-violet-400/20"
              disabled={isProcessing}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-violet-600 hover:bg-violet-100 rounded-xl"
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
