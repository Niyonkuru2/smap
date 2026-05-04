/**
 * Voice Service - Speech Recognition & Synthesis
 * Provides voice input (speech-to-text) and voice output (text-to-speech)
 * for accessibility and ease of use
 */

export interface VoiceCommand {
  type: 'search' | 'price' | 'market' | 'help' | 'unknown';
  query?: string;
  product?: string;
  market?: string;
  price?: number;
  rawText: string;
}

export interface VoiceServiceConfig {
  language: 'en' | 'rw' | 'fr';
  continuous?: boolean;
  interimResults?: boolean;
}

// Check browser support
export function isVoiceSupported(): { recognition: boolean; synthesis: boolean } {
  const recognition = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const synthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return { recognition, synthesis };
}

// Language mappings for speech recognition
const languageCodes: Record<string, string> = {
  en: 'en-US',
  rw: 'rw-RW', // Kinyarwanda
  fr: 'fr-FR',
};

// Voice command patterns for different languages
const commandPatterns = {
  en: {
    search: /(?:search|find|look for|show me|what is the price of)\s+(.+)/i,
    priceIn: /(?:price of|how much is)\s+(.+?)\s+(?:in|at)\s+(.+)/i,
    market: /(?:prices in|show|market)\s+(.+)/i,
    submit: /(?:submit|add|record)\s+(.+?)\s+(?:at|for)\s+(\d+)\s*(?:francs?|rwf)?/i,
    help: /(?:help|commands|what can you do)/i,
  },
  rw: {
    search: /(?:shakisha|reba|erekana)\s+(.+)/i,
    priceIn: /(?:igiciro cya|ni angahe)\s+(.+?)\s+(?:muri|i)\s+(.+)/i,
    market: /(?:ibiciro muri|isoko rya)\s+(.+)/i,
    submit: /(?:ohereza|shyiramo)\s+(.+?)\s+(?:kuri|)\s+(\d+)/i,
    help: /(?:ubufasha|amabwiriza)/i,
  },
  fr: {
    search: /(?:chercher|trouver|montrer|quel est le prix de)\s+(.+)/i,
    priceIn: /(?:prix de|combien coûte)\s+(.+?)\s+(?:à|au|dans)\s+(.+)/i,
    market: /(?:prix à|marché de)\s+(.+)/i,
    submit: /(?:soumettre|ajouter|enregistrer)\s+(.+?)\s+(?:à|pour)\s+(\d+)\s*(?:francs?)?/i,
    help: /(?:aide|commandes|que peux-tu faire)/i,
  },
};

// Voice response templates
const voiceResponses = {
  en: {
    greeting: 'Hello! I am listening. You can say "search rice" or "price of tomatoes in Kimironko".',
    notUnderstood: 'Sorry, I did not understand. Please try again.',
    searching: 'Searching for {query}...',
    priceResult: '{product} costs {price} francs per {unit} at {market}.',
    noResults: 'No prices found for {query}.',
    help: 'You can say: Search for a product, Price of product in market, or Help.',
    stopped: 'Voice input stopped.',
    error: 'An error occurred. Please try again.',
  },
  rw: {
    greeting: 'Muraho! Ndateze amatwi. Vuga "shakisha umuceri" cyangwa "igiciro cy\'inyanya i Kimironko".',
    notUnderstood: 'Mbabarira, sinumvise. Ongera ugerageze.',
    searching: 'Ndashakisha {query}...',
    priceResult: '{product} igura {price} amafaranga kuri {unit} i {market}.',
    noResults: 'Nta biciro byabonetse kuri {query}.',
    help: 'Ushobora kuvuga: Shakisha igicuruzwa, Igiciro cya igicuruzwa i isoko, cyangwa Ubufasha.',
    stopped: 'Gutega amatwi byahagaritswe.',
    error: 'Habaye ikibazo. Ongera ugerageze.',
  },
  fr: {
    greeting: 'Bonjour! Je vous écoute. Dites "chercher riz" ou "prix des tomates à Kimironko".',
    notUnderstood: 'Désolé, je n\'ai pas compris. Veuillez réessayer.',
    searching: 'Recherche de {query}...',
    priceResult: '{product} coûte {price} francs par {unit} à {market}.',
    noResults: 'Aucun prix trouvé pour {query}.',
    help: 'Vous pouvez dire: Chercher un produit, Prix du produit au marché, ou Aide.',
    stopped: 'Saisie vocale arrêtée.',
    error: 'Une erreur s\'est produite. Veuillez réessayer.',
  },
};

/**
 * Parse voice command to determine intent
 */
export function parseVoiceCommand(text: string, language: 'en' | 'rw' | 'fr' = 'en'): VoiceCommand {
  const patterns = commandPatterns[language];
  const normalizedText = text.toLowerCase().trim();

  // Check for help command
  if (patterns.help.test(normalizedText)) {
    return { type: 'help', rawText: text };
  }

  // Check for price in specific market
  let match = normalizedText.match(patterns.priceIn);
  if (match) {
    return {
      type: 'price',
      product: match[1].trim(),
      market: match[2].trim(),
      rawText: text,
    };
  }

  // Check for submit command
  match = normalizedText.match(patterns.submit);
  if (match) {
    return {
      type: 'price',
      product: match[1].trim(),
      price: parseInt(match[2]),
      rawText: text,
    };
  }

  // Check for market command
  match = normalizedText.match(patterns.market);
  if (match) {
    return {
      type: 'market',
      market: match[1].trim(),
      rawText: text,
    };
  }

  // Check for search command
  match = normalizedText.match(patterns.search);
  if (match) {
    return {
      type: 'search',
      query: match[1].trim(),
      rawText: text,
    };
  }

  // Default to search with the entire text
  if (normalizedText.length > 2) {
    return {
      type: 'search',
      query: normalizedText,
      rawText: text,
    };
  }

  return { type: 'unknown', rawText: text };
}

/**
 * Get response message in the appropriate language
 */
export function getVoiceResponse(
  key: keyof typeof voiceResponses.en,
  language: 'en' | 'rw' | 'fr' = 'en',
  replacements: Record<string, string | number> = {}
): string {
  let response = voiceResponses[language][key] || voiceResponses.en[key];
  
  Object.entries(replacements).forEach(([key, value]) => {
    response = response.replace(`{${key}}`, String(value));
  });
  
  return response;
}

/**
 * Text-to-Speech: Speak the given text
 */
export function speak(
  text: string,
  language: 'en' | 'rw' | 'fr' = 'en',
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  }
): SpeechSynthesisUtterance | null {
  const { synthesis } = isVoiceSupported();
  if (!synthesis) {
    console.warn('Speech synthesis not supported');
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languageCodes[language] || 'en-US';
  utterance.rate = options?.rate ?? 0.9;
  utterance.pitch = options?.pitch ?? 1;
  utterance.volume = options?.volume ?? 1;

  // Try to find a voice for the language
  const voices = window.speechSynthesis.getVoices();
  const langCode = languageCodes[language];
  const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
  if (voice) {
    utterance.voice = voice;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }
  if (options?.onError) {
    utterance.onerror = (event) => options.onError?.(new Error(event.error));
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (isVoiceSupported().synthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speech Recognition class for continuous voice input
 */
export class VoiceRecognition {
  private recognition: SpeechRecognitionInterface | null = null;
  private isListening = false;
  private language: string;

  constructor(config: VoiceServiceConfig) {
    this.language = languageCodes[config.language] || 'en-US';
    this.initRecognition(config);
  }

  private initRecognition(config: VoiceServiceConfig): void {
    const { recognition } = isVoiceSupported();
    if (!recognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = this.language;
    this.recognition.continuous = config.continuous ?? false;
    this.recognition.interimResults = config.interimResults ?? true;
  }

  /**
   * Start listening for voice input
   */
  start(callbacks: {
    onResult?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
    onStart?: () => void;
  }): boolean {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      callbacks.onResult?.(transcript, isFinal);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      callbacks.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      callbacks.onError?.('Failed to start recognition');
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Change language
   */
  setLanguage(language: 'en' | 'rw' | 'fr'): void {
    this.language = languageCodes[language] || 'en-US';
    if (this.recognition) {
      this.recognition.lang = this.language;
    }
  }
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInterface {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInterface;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
