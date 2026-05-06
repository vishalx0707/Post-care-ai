'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageThread } from '@/components/synex/MessageThread';
import { Waveform } from '@/components/synex/Waveform';
import { createClientMessageId, normalizeChatHistoryPayload } from '@/lib/health/chat-history';

export default function CompanionPage() {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [listening, setListening] = useState(false);
  const [handledInitialMessage, setHandledInitialMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const initialMessageRef = useRef(undefined);
  const { user, getIdToken, profile } = useAuth();

  const companionName = profile?.aiCompanionName || 'AI Companion';
  const userName = profile?.displayName || '';

  const getInitialMessage = useCallback(() => {
    if (initialMessageRef.current === undefined) {
      initialMessageRef.current = new URLSearchParams(window.location.search).get('message')?.trim() || '';
    }
    return initialMessageRef.current;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || !user || streaming) return;

    const userMsg = {
      id: createClientMessageId('user'),
      role: 'user',
      content: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const aiMsgId = createClientMessageId('assistant');
    setStreamingId(aiMsgId);
    setMessages((prev) => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }]);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId, message: text.trim() }),
      });
      const newConvId = res.headers.get('x-conversation-id');
      if (newConvId) setConversationId(newConvId);
      if (!res.ok) throw new Error('Failed to get AI response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: fullText } : m));
      }

      if (mode === 'voice' && fullText && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(fullText.replace(/[*#_`>]/g, ''));
        u.rate = 1.0; u.pitch = 1.0;
        speechSynthesis.speak(u);
      }
    } catch (err) {
      setMessages((prev) => prev.map((m) => m.id === aiMsgId
        ? { ...m, content: "Sorry, I couldn't process that. Please try again." }
        : m));
    } finally {
      setStreaming(false);
      setStreamingId(null);
    }
  }, [user, getIdToken, conversationId, streaming, mode]);

  useEffect(() => {
    if (handledInitialMessage || !user || streaming) return;
    const initial = getInitialMessage();
    if (!initial) { setHandledInitialMessage(true); return; }
    setHandledInitialMessage(true);
    setMode('chat');
    window.history.replaceState(null, '', '/dashboard/companion');
    sendMessage(initial);
  }, [getInitialMessage, handledInitialMessage, sendMessage, streaming, user]);

  useEffect(() => {
    if (!user || !handledInitialMessage) return undefined;

    if (getInitialMessage()) {
      setHistoryLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const token = await getIdToken();
        const res = await fetch('/api/chat', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load chat history');

        const history = normalizeChatHistoryPayload(await res.json());
        if (cancelled) return;

        setConversationId(history.conversationId);
        setMessages(history.messages);
      } catch {
        if (!cancelled) setHistoryError('Could not load your previous chat history.');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [getIdToken, getInitialMessage, handledInitialMessage, user]);

  const handleSend = () => sendMessage(input);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onresult = (e) => {
      const t = Array.from(e.results).map((x) => x[0].transcript).join('');
      if (e.results[0].isFinal) { sendMessage(t); setListening(false); }
      else setInput(t);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    r.start();
  }, [sendMessage]);

  const stopListening = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); setListening(false); }
  };
  const toggleVoice = () => listening ? stopListening() : startListening();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Topbar */}
      <header className="flex items-end justify-between mb-10 pb-6 border-b border-rule">
        <h1 className="font-serif text-3xl text-ink leading-none">{companionName}</h1>
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-6">
        {mode === 'chat' ? (
          historyLoading ? (
            <div className="max-w-[60ch] mx-auto pt-12">
              <p className="font-serif text-3xl md:text-4xl text-ink leading-tight">Loading your last conversation.</p>
              <p className="text-ink-3 mt-3 text-base">Your saved chat history will appear here.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="max-w-[60ch] mx-auto pt-12">
              <p className="font-serif text-3xl md:text-4xl text-ink leading-tight">
                Hi{userName ? `, ${userName}` : ''}.
              </p>
              <p className="text-ink-3 mt-3 text-base">
                Ask {companionName} about your reports, medications, or recovery.
              </p>
              {historyError && <p className="text-sm text-ink-3 mt-4">{historyError}</p>}
            </div>
          ) : (
            <MessageThread
              messages={messages}
              companionName={companionName}
              userName={userName || 'you'}
              streamingId={streamingId}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <button onClick={toggleVoice} className="cursor-pointer">
              <Waveform listening={listening} />
            </button>
            <p className="font-serif italic text-2xl text-ink-2">
              {listening ? 'Listening.' : streaming ? 'Thinking.' : 'Tap to speak.'}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-rule pt-6">
        <div className="flex items-center gap-3 max-w-[68ch] mx-auto">
          <Input
            type="text"
            placeholder={`Message ${companionName}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming || historyLoading}
            className="text-base flex-1"
            id="companion-chat-input"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={mode === 'chat' && input.trim() ? handleSend : toggleVoice}
            disabled={streaming || historyLoading}
            aria-label={mode === 'chat' && input.trim() ? 'Send' : 'Toggle microphone'}
          >
            {mode === 'chat' && input.trim() ? <Send size={18} strokeWidth={1.5} /> : listening ? <MicOff size={18} strokeWidth={1.5} /> : <Mic size={18} strokeWidth={1.5} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
