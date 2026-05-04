import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Volume2,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  placeholder?: string;
  language?: 'en' | 'rw' | 'fr';
}

// Check if Web Speech API is supported
const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Check if running on secure context (needed for microphone)
const isSecureContext = () => {
  return window.isSecureContext || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.protocol === 'https:';
};

export function VoiceSearch({ 
  onSearch, 
  onTranscript,
  placeholder = 'Say a product name...',
  language = 'en'
}: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Language codes for speech recognition
  const languageCodes: Record<string, string> = {
    en: 'en-US',
    rw: 'rw-RW', // Kinyarwanda
    fr: 'fr-FR'
  };

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setIsSupported(false);
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }

    if (!isSecureContext()) {
      console.warn('Voice search requires secure context (HTTPS or localhost)');
      // Still allow initialization, will show error when user tries to use it
    }

    try {
      // Initialize speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false; // Single result mode is more reliable
      recognition.interimResults = true;
      recognition.lang = languageCodes[language] || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(Math.round(result[0].confidence * 100));
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (onTranscript) {
        onTranscript(currentTranscript, !!finalTranscript);
      }

      // Auto-search on final result
      if (finalTranscript && finalTranscript.trim().length > 0) {
        setTimeout(() => {
          onSearch(finalTranscript.trim());
          stopListening();
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          toast.info('No speech detected. Try again.');
          break;
        case 'not-allowed':
        case 'service-not-allowed':
          toast.error('Microphone access denied. Please allow microphone access in browser settings.');
          setIsSupported(false);
          break;
        case 'network':
          toast.error('Network error. Check your internet connection.');
          break;
        case 'aborted':
          // User stopped, no error needed
          break;
        case 'audio-capture':
          toast.error('No microphone found. Please connect a microphone.');
          break;
        default:
          toast.error(`Voice recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsSupported(false);
      return;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }
    };
  }, [language, onSearch, onTranscript]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      toast.error('Voice search is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (!isSecureContext()) {
      toast.error('Voice search requires HTTPS or localhost');
      return;
    }

    // Check if already listening
    if (isListening) {
      return;
    }

    setTranscript('');
    setConfidence(0);
    
    try {
      // Request microphone permission first
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          try {
            recognitionRef.current.start();
            toast.info('Listening... Speak now');
          } catch (error: any) {
            if (error.message?.includes('already started')) {
              // Already listening, ignore
            } else {
              console.error('Error starting recognition:', error);
              toast.error('Failed to start voice recognition. Please try again.');
            }
          }
        })
        .catch((err) => {
          console.error('Microphone permission denied:', err);
          toast.error('Microphone access denied. Please allow microphone access in browser settings.');
          setIsSupported(false);
        });
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast.error('Failed to start voice recognition');
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const handleSearch = () => {
    if (transcript.trim()) {
      onSearch(transcript.trim());
      setTranscript('');
      stopListening();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setConfidence(0);
  };

  if (!isSupported) {
    return (
      <Card className="bg-green-950 dark:bg-green-950 border-green-700">
        <CardContent className="py-3">
          <p className="text-sm text-green-100 dark:text-green-100 flex items-center gap-2">
            <MicOff className="h-4 w-4" />
            Voice search is not supported in this browser. Try Chrome or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Button */}
      <div className="flex items-center gap-3">
        <Button
          variant={isListening ? 'destructive' : 'default'}
          size="lg"
          className={`h-14 w-14 rounded-full ${isListening ? 'animate-pulse' : ''}`}
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        <div className="flex-1">
          {isListening ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-green-600 rounded-full animate-pulse"
                    style={{
                      height: Math.random() * 20 + 10,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Listening...</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{placeholder}</p>
          )}
        </div>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <Card className="relative">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <Volume2 className="h-4 w-4 text-green-600 shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-medium">{transcript}</p>
                {confidence > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {confidence}% confident
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearTranscript}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Commands Help */}
      {!isListening && !transcript && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Try saying:</p>
          <ul className="ml-4 space-y-0.5">
            <li>• "Rice prices" or "Tomatoes"</li>
            <li>• "Cheapest cooking oil"</li>
            <li>• "Prices in Kimironko market"</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Compact version for search bars
export function VoiceSearchButton({ 
  onSearch,
  language = 'en'
}: { 
  onSearch: (query: string) => void;
  language?: 'en' | 'rw' | 'fr';
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'rw' ? 'rw-RW' : language === 'fr' ? 'fr-FR' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onSearch(transcript);
      }
    };

    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onSearch]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice search not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      toast.info('Listening...');
    }
  };

  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleListening}
      className={isListening ? 'text-green-600 animate-pulse' : ''}
    >
      {isListening ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}

export default VoiceSearch;
