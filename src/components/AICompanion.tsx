/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Trash2, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../types';

interface AICompanionProps {
  onClose: () => void;
  onViewProduct: (productId: string) => void;
}

export default function AICompanion({ onClose, onViewProduct }: AICompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your **Gemini Shop Companion**. 🌸\n\nI can help you browse our premium collection, suggest items matching your budget, or recommend accessories for your workspace!\n\nTry asking me:\n- *'Suggest some sleek gadgets for a minimal desk setup.'*\n- *'What high-quality accessories do we carry under $100?'*\n- *'Recommend something elegant for a coffee lover.'*",
      createdAt: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest chats
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const activeText = textToSend || input;
    if (!activeText.trim() || loading) return;

    if (!textToSend) setInput('');

    const userMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: activeText,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg];
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!res.ok) {
        throw new Error('AI Companion connection timed out');
      }

      const data = await res.json();
      
      const assistantMsg: ChatMessage = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: data.text,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'error_msg',
        sender: 'assistant',
        text: "I apologize, but I encountered a network bottleneck. Please double-check your API configurations in Settings.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear your conversation logs?')) {
      setMessages([
        {
          id: 'welcome_re',
          sender: 'assistant',
          text: "Logs refreshed. How can I guide your shopping experience today?",
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  // Safe client-side Markdown formatter (interprets bold, lists, and links)
  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;

      // Escape bold tags: **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-950">$1</strong>');
      
      // Escape italic tags: *text* or _text_
      formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');

      // Detect bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listContent = formatted.replace(/^[\s-*]+/, '');
        return (
          <li key={idx} className="list-disc list-inside text-xs sm:text-sm text-gray-600 ml-2 mb-1.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: listContent }} />
        );
      }

      // Detect catalog product links [Product ID: prod_1] and turn them into direct clickable action buttons
      const prodLinkMatch = line.match(/prod_\w+/g);
      if (prodLinkMatch) {
        return (
          <div key={idx} className="my-2 p-1.5 bg-gray-50 border border-gray-150 rounded-lg flex items-center justify-between gap-3 shadow-3xs hover:border-gray-350 transition">
            <span className="text-xs text-gray-600 block leading-normal font-medium" dangerouslySetInnerHTML={{ __html: formatted }}></span>
            {prodLinkMatch.map(pId => (
              <button
                key={pId}
                onClick={() => onViewProduct(pId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-950 text-white rounded-md text-[10px] font-bold hover:bg-gray-800 transition whitespace-nowrap cursor-pointer"
              >
                <span>View Product</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        );
      }

      // General paragraph lines
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }

      return (
        <p key={idx} className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-1.5" dangerouslySetInnerHTML={{ __html: formatted }}></p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="ai-companion-drawer">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-gray-100" id="ai-companion-panel">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-violet-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-violet-900 tracking-tight leading-tight">Gemini Shop Companion</h2>
                <span className="text-[9px] font-bold tracking-wider uppercase text-violet-500 font-mono block -mt-0.5">Live AI Concierge</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                id="close-ai-companion-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 no-scrollbar" id="ai-chats-history">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    isAssistant ? 'self-start' : 'ml-auto flex-row-reverse'
                  }`}
                >
                  {/* Sender Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-3xs ${
                    isAssistant ? 'bg-violet-100 text-violet-700' : 'bg-gray-900 text-white'
                  }`}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Body Text */}
                  <div className={`p-4 rounded-2xl border text-left ${
                    isAssistant 
                      ? 'bg-white border-gray-100 shadow-3xs rounded-tl-xs' 
                      : 'bg-violet-600 border-violet-600 text-white shadow-xs rounded-tr-xs'
                  }`}>
                    {isAssistant ? (
                      <div className="space-y-0.5">{formatMarkdown(msg.text)}</div>
                    ) : (
                      <p className="text-xs sm:text-sm text-white leading-relaxed">{msg.text}</p>
                    )}
                    <span className={`block text-[8px] font-mono mt-2 text-right ${
                      isAssistant ? 'text-gray-400' : 'text-violet-200'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Waiting loader */}
            {loading && (
              <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shadow-3xs">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-3xs rounded-tl-xs">
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Quick recommendations pills */}
          <div className="px-6 py-2.5 border-t border-gray-100/50 overflow-x-auto no-scrollbar flex gap-2 bg-gray-50/20">
            {[
              "Premium gadgets under $150",
              "Sleek ceramic mugs",
              "Leather backpacks",
            ].map((pill, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(pill)}
                className="px-3 py-1.5 bg-white hover:bg-violet-50 text-gray-600 hover:text-violet-700 rounded-full border border-gray-150 hover:border-violet-200 text-[10px] font-semibold whitespace-nowrap transition cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Input Panel Form */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gemini to find a product..."
                className="w-full pl-4 pr-12 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-violet-500/10 focus:border-violet-600 transition"
                id="ai-companion-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 p-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-30 disabled:bg-gray-300 transition cursor-pointer"
                id="ai-companion-send-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <span className="block text-[9px] text-gray-400 text-center mt-2 font-medium">
              Powered securely by server-side Gemini 3.5 Flash
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
