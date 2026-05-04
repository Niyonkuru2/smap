import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Mic, MicOff, Volume2, VolumeX, Search, X, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import {
  isVoiceSupported,
  VoiceRecognition,
  parseVoiceCommand,
  getVoiceResponse,
  speak,
  stopSpeaking,
  VoiceCommand,
} from '../lib/voiceService';

interface VoiceSearchProps {
  onSearch?: (query: string) => void;
  onCommand?: (command: VoiceCommand) => void;
  placeholder?: string;
  className?: string;
  showHelp?: boolean;
}

export function VoiceSearch({
  onSearch,
  onCommand,
  placeholder,
  className = '',
  showHelp = true,
}: VoiceSearchProps) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [isSupported, setIsSupported] = useState({ recognition: false, synthesis: false });
  
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  // Check voice support on mount
  useEffect(() => {
    setIsSupported(isVoiceSupported());
  }, []);

  // Initialize recognition when language changes
  useEffect(() => {
    if (isSupported.recognition) {
      recognitionRef.current = new VoiceRecognition({
        language: language as 'en' | 'rw' | 'fr',
        continuous: false,
        interimResults: true,
      });
    }
  }, [language, isSupported.recognition]);

  // Start voice recognition
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    // Speak greeting
    if (isSupported.synthesis) {
      speak(getVoiceResponse('greeting', language as 'en' | 'rw' | 'fr'), language as 'en' | 'rw' | 'fr');
    }

    const started = recognitionRef.current.start({
      onStart: () => {
        setIsListening(true);
        setTranscript('');
      },
      onResult: (text, isFinal) => {
        setTranscript(text);
        
        if (isFinal) {
          handleVoiceResult(text);
        }
      },
      onError: (error) => {
        setIsListening(false);
        if (error !== 'aborted') {
          toast.error(`Voice error: ${error}`);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started) {
      toast.error('Failed to start voice recognition');
    }
  }, [language, isSupported.synthesis]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    stopSpeaking();
  }, []);

  // Handle voice result
  const handleVoiceResult = useCallback((text: string) => {
    const command = parseVoiceCommand(text, language as 'en' | 'rw' | 'fr');
    
    if (command.type === 'help') {
      const helpText = getVoiceResponse('help', language as 'en' | 'rw' | 'fr');
      speakResponse(helpText);
      setShowHelpPanel(true);
      return;
    }

    if (command.type === 'unknown') {
      speakResponse(getVoiceResponse('notUnderstood', language as 'en' | 'rw' | 'fr'));
      return;
    }

    // Announce searching
    if (command.query || command.product) {
      const searchTerm = command.query || command.product || '';
      speakResponse(getVoiceResponse('searching', language as 'en' | 'rw' | 'fr', { query: searchTerm }));
      setSearchQuery(searchTerm);
      onSearch?.(searchTerm);
    }

    onCommand?.(command);
  }, [language, onSearch, onCommand]);

  // Speak response
  const speakResponse = useCallback((text: string) => {
    if (!isSupported.synthesis) return;
    
    setIsSpeaking(true);
    speak(text, language as 'en' | 'rw' | 'fr', {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [language, isSupported.synthesis]);

  // Stop speaking
  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // Handle manual search
  const handleManualSearch = () => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      const command = parseVoiceCommand(searchQuery, language as 'en' | 'rw' | 'fr');
      onCommand?.(command);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  // Translations
  const t = {
    en: {
      voiceSearch: 'Voice Search',
      listening: 'Listening...',
      speakNow: 'Speak now',
      stopListening: 'Stop',
      notSupported: 'Voice not supported',
      helpTitle: 'Voice Commands',
      helpSearch: '"Search rice" - Find product prices',
      helpPrice: '"Price of tomatoes in Kimironko" - Get specific market price',
      helpMarket: '"Show Nyabugogo market" - View market prices',
      helpClose: 'Close',
      placeholder: 'Search or use voice...',
    },
    rw: {
      voiceSearch: 'Gushakisha n\'ijwi',
      listening: 'Ndateze amatwi...',
      speakNow: 'Vuga ubu',
      stopListening: 'Hagarika',
      notSupported: 'Ijwi ntiryemewe',
      helpTitle: 'Amabwiriza y\'ijwi',
      helpSearch: '"Shakisha umuceri" - Shaka ibiciro by\'ibicuruzwa',
      helpPrice: '"Igiciro cy\'inyanya i Kimironko" - Kubona igiciro cy\'isoko',
      helpMarket: '"Erekana isoko rya Nyabugogo" - Reba ibiciro by\'isoko',
      helpClose: 'Funga',
      placeholder: 'Shakisha cyangwa ukoreshe ijwi...',
    },
    fr: {
      voiceSearch: 'Recherche vocale',
      listening: 'J\'écoute...',
      speakNow: 'Parlez maintenant',
      stopListening: 'Arrêter',
      notSupported: 'Voix non supportée',
      helpTitle: 'Commandes vocales',
      helpSearch: '"Chercher riz" - Trouver les prix des produits',
      helpPrice: '"Prix des tomates à Kimironko" - Obtenir le prix du marché',
      helpMarket: '"Montrer le marché de Nyabugogo" - Voir les prix du marché',
      helpClose: 'Fermer',
      placeholder: 'Rechercher ou utiliser la voix...',
    },
  };

  const texts = t[language as keyof typeof t] || t.en;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input with Voice Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder || texts.placeholder}
            className="pl-10 pr-4"
          />
        </div>

        {/* Voice Input Button */}
        {isSupported.recognition ? (
          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className={isListening ? 'animate-pulse' : ''}
            title={isListening ? texts.stopListening : texts.voiceSearch}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        ) : null}

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleStopSpeaking}
            title="Stop speaking"
          >
            <VolumeX className="h-4 w-4" />
          </Button>
        )}

        {/* Help Button */}
        {showHelp && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelpPanel(!showHelpPanel)}
            title={texts.helpTitle}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        )}

        {/* Search Button */}
        <Button onClick={handleManualSearch} size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Listening Indicator */}
      {isListening && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 z-50 glass-card">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Mic className="h-6 w-6 text-green-500 animate-pulse" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{texts.listening}</p>
              <p className="text-xs text-muted-foreground">{texts.speakNow}</p>
            </div>
            {transcript && (
              <p className="text-sm italic text-primary">"{transcript}"</p>
            )}
          </div>
        </Card>
      )}

      {/* Help Panel */}
      {showHelpPanel && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 z-50 glass-card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {texts.helpTitle}
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setShowHelpPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Mic className="h-4 w-4 mt-0.5 text-primary" />
              <span>{texts.helpSearch}</span>
            </li>
            <li className="flex items-start gap-2">
              <Mic className="h-4 w-4 mt-0.5 text-primary" />
              <span>{texts.helpPrice}</span>
            </li>
            <li className="flex items-start gap-2">
              <Mic className="h-4 w-4 mt-0.5 text-primary" />
              <span>{texts.helpMarket}</span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}

/**
 * Speak Price Button - Reads price information aloud
 */
interface SpeakPriceButtonProps {
  product: string;
  price: number;
  unit: string;
  market: string;
  className?: string;
}

export function SpeakPriceButton({ product, price, unit, market, className }: SpeakPriceButtonProps) {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(isVoiceSupported().synthesis);
  }, []);

  const handleSpeak = () => {
    if (!isSupported) {
      toast.error('Text-to-speech not supported');
      return;
    }

    const text = getVoiceResponse('priceResult', language as 'en' | 'rw' | 'fr', {
      product,
      price,
      unit,
      market,
    });

    setIsSpeaking(true);
    speak(text, language as 'en' | 'rw' | 'fr', {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleStop = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={isSpeaking ? handleStop : handleSpeak}
      className={className}
      title={isSpeaking ? 'Stop' : 'Read aloud'}
    >
      {isSpeaking ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}

export default VoiceSearch;
