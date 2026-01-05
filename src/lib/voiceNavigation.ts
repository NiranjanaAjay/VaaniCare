// Voice Navigation Types and Utilities

export type ServiceId =
  | "healthcare"
  | "emergency"
  | "legal"
  | "government"
  | "employment";

export type VoiceAction =
  | "navigate"
  | "select"
  | "confirm"
  | "cancel"
  | "back"
  | "help"
  | "unknown";

export interface VoiceDecision {
  action: VoiceAction;
  targetId: ServiceId | string | null;
  confidence: number;
  originalTranscript: string;
  language?: string;
}

// Service keywords for voice recognition in multiple languages
export const serviceKeywords: Record<
  ServiceId,
  { en: string[]; ml: string[] }
> = {
  healthcare: {
    en: [
      "healthcare",
      "health",
      "doctor",
      "hospital",
      "medical",
      "clinic",
      "medicine",
      "sick",
      "illness",
      "treatment",
      "nurse",
      "checkup",
      "appointment",
      "physician",
      "health care",
      "consultation",
    ],
    ml: [
      "ആരോഗ്യം",
      "ഡോക്ടർ",
      "ആശുപത്രി",
      "മരുന്ന്",
      "ചികിത്സ",
      "ക്ലിനിക്",
      "നഴ്സ്",
      "അപ്പോയിന്റ്മെന്റ്",
      "രോഗം",
      "വൈദ്യൻ",
      "ആരോഗ്യ",
      "ഡോക്ടറെ",
      "ആശുപത്രിയിൽ",
      "മരുന്ന",
      "ചികിത്സ",
      "doctor",
      "hospital",
      "health",
      "arogyam",
      "vaidyan",
    ],
  },
  emergency: {
    en: [
      "emergency",
      "help",
      "police",
      "ambulance",
      "fire",
      "accident",
      "danger",
      "urgent",
      "rescue",
      "911",
      "100",
      "108",
      "101",
      "women helpline",
      "helpline",
      "crisis",
    ],
    ml: [
      "അടിയന്തരം",
      "സഹായം",
      "പോലീസ്",
      "ആംബുലൻസ്",
      "തീ",
      "അപകടം",
      "അപായം",
      "അത്യാവശ്യം",
      "രക്ഷ",
      "ഹെൽപ്‌ലൈൻ",
      "അടിയന്തിര",
      "പോലീസിനെ",
      "ആംബുലൻസിനെ",
      "സഹായം",
      "emergency",
      "police",
      "ambulance",
      "sahayam",
      "help",
    ],
  },
  legal: {
    en: [
      "legal",
      "lawyer",
      "law",
      "rights",
      "court",
      "justice",
      "advocate",
      "complaint",
      "case",
      "attorney",
      "legal aid",
      "lawsuit",
      "petition",
      "judgment",
    ],
    ml: [
      "നിയമം",
      "വക്കീൽ",
      "അവകാശം",
      "കോടതി",
      "നീതി",
      "അഭിഭാഷകൻ",
      "പരാതി",
      "കേസ്",
      "നിയമ സഹായം",
      "നിയമ",
      "വക്കീലിനെ",
      "കോടതിയിൽ",
      "അവകാശങ്ങൾ",
      "legal",
      "lawyer",
      "niyamam",
      "vakkeel",
      "court",
    ],
  },
  government: {
    en: [
      "government",
      "scheme",
      "pension",
      "subsidy",
      "benefit",
      "welfare",
      "ration",
      "card",
      "certificate",
      "document",
      "registration",
      "application",
      "eligibility",
      "sarkar",
    ],
    ml: [
      "സർക്കാർ",
      "പദ്ധതി",
      "പെൻഷൻ",
      "സബ്സിഡി",
      "ആനുകൂല്യം",
      "ക്ഷേമം",
      "റേഷൻ",
      "കാർഡ്",
      "സർട്ടിഫിക്കറ്റ്",
      "രജിസ്ട്രേഷൻ",
      "സർക്കാരിന്റെ",
      "പദ്ധതികൾ",
      "പെൻഷൻ",
      "സർക്കാരിൽ",
      "government",
      "sarkar",
      "pension",
      "scheme",
      "ration",
    ],
  },
  employment: {
    en: [
      "employment",
      "job",
      "work",
      "career",
      "hiring",
      "vacancy",
      "resume",
      "interview",
      "salary",
      "occupation",
      "profession",
      "skill",
      "training",
      "income",
      "labour",
      "labor",
    ],
    ml: [
      "തൊഴിൽ",
      "ജോലി",
      "വേല",
      "ജോലി ഒഴിവ്",
      "ശമ്പളം",
      "വരുമാനം",
      "പരിശീലനം",
      "കഴിവ്",
      "തൊഴിലാളി",
      "ജോലിക്ക്",
      "തൊഴിലിന്",
      "ജോലികൾ",
      "വേലക്ക്",
      "job",
      "work",
      "employment",
      "joli",
      "thozhil",
    ],
  },
};

// Navigation commands
export const navigationKeywords = {
  back: {
    en: ["back", "go back", "return", "previous", "home"],
    ml: ["തിരികെ", "പിന്നിലേക്ക്", "ഹോം", "മുൻപേജ്"],
  },
  confirm: {
    en: ["yes", "confirm", "okay", "ok", "sure", "correct", "right", "proceed"],
    ml: ["അതെ", "ശരി", "ഓക്കേ", "ശരിയാണ്", "തുടരുക"],
  },
  cancel: {
    en: ["no", "cancel", "stop", "wrong", "incorrect", "exit"],
    ml: ["ഇല്ല", "വേണ്ട", "നിർത്തുക", "തെറ്റ്", "റദ്ദാക്കുക"],
  },
  help: {
    en: ["help", "what can you do", "options", "menu", "assist"],
    ml: ["സഹായം", "എന്ത് ചെയ്യാം", "ഓപ്ഷനുകൾ", "മെനു"],
  },
};

// Normalize text for comparison
function normalizeText(text: string): string {
  // Normalize Unicode (important for Malayalam and other Indic scripts)
  // NFC normalization combines characters with their diacritics
  return text.toLowerCase().trim().normalize("NFC");
}

// Check if text contains keyword (with fuzzy matching for Indic scripts)
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  // Direct inclusion check
  if (normalizedText.includes(normalizedKeyword)) {
    return true;
  }

  // Check if any word in the text matches the keyword
  const words = normalizedText.split(/\s+/);
  for (const word of words) {
    if (word === normalizedKeyword) return true;
    // Partial match - if keyword is found within a word or vice versa
    if (word.includes(normalizedKeyword) || normalizedKeyword.includes(word)) {
      // Only count if substantial overlap (at least 3 characters match)
      if (word.length >= 3 && normalizedKeyword.length >= 3) {
        return true;
      }
    }
  }

  return false;
}

// Calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Simple word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const overlap = words1.filter((w) =>
    words2.some((w2) => w.includes(w2) || w2.includes(w)),
  ).length;
  return overlap / Math.max(words1.length, words2.length);
}

// Route from transcript to voice decision
export function routeFromTranscript(
  transcript: string,
  language: string = "en",
): VoiceDecision {
  const normalized = normalizeText(transcript);
  let bestMatch: { service: ServiceId | null; score: number } = {
    service: null,
    score: 0,
  };

  console.log("🔍 Processing transcript:", transcript);
  console.log("🔍 Normalized:", normalized);
  console.log("🔍 Language:", language);

  // Check for navigation commands first
  for (const [action, keywords] of Object.entries(navigationKeywords)) {
    const langKeywords = keywords[language as "en" | "ml"] || keywords.en;
    for (const keyword of langKeywords) {
      if (containsKeyword(normalized, keyword)) {
        console.log(
          "✅ Matched navigation command:",
          action,
          "with keyword:",
          keyword,
        );
        return {
          action: action as VoiceAction,
          targetId: null,
          confidence: 0.9,
          originalTranscript: transcript,
          language,
        };
      }
    }
  }

  // Check for service keywords
  for (const [service, keywords] of Object.entries(serviceKeywords)) {
    const langKeywords = keywords[language as "en" | "ml"] || keywords.en;
    console.log(
      `🔎 Checking service "${service}" with keywords:`,
      langKeywords,
    );

    for (const keyword of langKeywords) {
      const directMatch = containsKeyword(normalized, keyword);
      const similarity = calculateSimilarity(normalized, keyword);

      if (directMatch) {
        console.log(
          `✅ Direct match for "${service}" with keyword "${keyword}"`,
        );
        if (1 > bestMatch.score) {
          bestMatch = { service: service as ServiceId, score: 1 };
        }
      } else if (similarity > 0.5) {
        console.log(
          `🔶 Similarity match for "${service}": ${similarity} with keyword "${keyword}"`,
        );
        if (similarity > bestMatch.score) {
          bestMatch = { service: service as ServiceId, score: similarity };
        }
      }
    }
  }

  if (bestMatch.service && bestMatch.score > 0.4) {
    console.log(
      "🎯 Best match:",
      bestMatch.service,
      "with score:",
      bestMatch.score,
    );
    return {
      action: "navigate",
      targetId: bestMatch.service,
      confidence: bestMatch.score,
      originalTranscript: transcript,
      language,
    };
  }

  console.log("❌ No match found for transcript");
  return {
    action: "unknown",
    targetId: null,
    confidence: 0,
    originalTranscript: transcript,
    language,
  };
}

// Get greeting based on time of day
export function getTimeBasedGreeting(language: string): string {
  const hour = new Date().getHours();

  if (language === "ml") {
    if (hour < 12) return "greetingMorning";
    if (hour < 17) return "greetingAfternoon";
    return "greetingEvening";
  }

  if (hour < 12) return "greetingMorning";
  if (hour < 17) return "greetingAfternoon";
  return "greetingEvening";
}

// Get full greeting with service options based on time of day
// This is designed for visually impaired users - announces all available services
export function getFullGreetingWithOptions(_language: string): string {
  const hour = new Date().getHours();

  if (hour < 12) return "fullGreetingMorning";
  if (hour < 17) return "fullGreetingAfternoon";
  return "fullGreetingEvening";
}
