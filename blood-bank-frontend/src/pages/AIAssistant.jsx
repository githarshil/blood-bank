import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const SUGGESTED_QUESTIONS = [
  "Which blood group is critically low?",
  "How many donors do we have?",
  "What requests are pending?",
  "Which blood groups are safe?",
  "Generate an emergency alert for O-"
];

const SCREENER_QUESTIONS = [
  "Are you between 18 and 65 years of age?",
  "Do you weigh more than 50 kg?",
  "Have you had any illness, cold, or fever in the last 2 weeks?",
  "Have you donated blood in the last 3 months?",
  "Are you currently taking any medication or antibiotics?"
];

function AIAssistant() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'screener'

  // API Key & Model local state (cached securely in localStorage)
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('lifeFlow_geminiKey') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('lifeFlow_geminiModel') || 'gemini-1.5-flash';
  });

  const [showKeySetting, setShowKeySetting] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempModel, setTempModel] = useState(selectedModel);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const messagesEndRef = useRef(null);

  // Screener State
  const [screenerStep, setScreenerStep] = useState(0); // 0 to 4 (questions), 5 (submitting), 6 (result)
  const [screenerAnswers, setScreenerAnswers] = useState([]);
  const [screenerVerdict, setScreenerVerdict] = useState(null); // { eligible: boolean, reason: string }
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerError, setScreenerError] = useState('');

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Save customized API settings
  const handleSaveKey = (e) => {
    e.preventDefault();
    const trimmedKey = tempKey.trim();
    localStorage.setItem('lifeFlow_geminiKey', trimmedKey);
    setApiKey(trimmedKey);

    localStorage.setItem('lifeFlow_geminiModel', tempModel);
    setSelectedModel(tempModel);

    setShowKeySetting(false);
  };

  const handleClearKey = () => {
    localStorage.removeItem('lifeFlow_geminiKey');
    localStorage.removeItem('lifeFlow_geminiModel');
    setApiKey('');
    setTempKey('');
    setSelectedModel('gemini-1.5-flash');
    setTempModel('gemini-1.5-flash');
    setShowKeySetting(false);
  };

  // --- Unified Gemini Request with Automatic Fallback ---
  const fetchGeminiResponse = async (systemPromptText, contentsList) => {
    const modelsToTry = [selectedModel, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
    // Filter duplicates while keeping index priority order
    const uniqueModels = Array.from(new Set(modelsToTry));

    let lastError = null;

    for (const model of uniqueModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPromptText }]
            },
            contents: contentsList
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (reply) {
            // Auto-align model configurations to the successful candidate
            if (model !== selectedModel) {
              setSelectedModel(model);
              setTempModel(model);
              localStorage.setItem('lifeFlow_geminiModel', model);
            }
            return reply;
          }
        } else {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = errJson.error?.message || `HTTP ${response.status}`;
          lastError = new Error(`Model ${model} failed: ${errMsg}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("All model cascade pipelines failed to resolve.");
  };

  // --- TAB 1: CHAT LOGIC ---
  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim()) return;

    if (!queryText) {
      setInputValue('');
    }

    setChatError('');

    // Append User Message to local UI chat bubbles
    const userMsg = { role: 'user', content: textToSend };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setChatLoading(true);

    if (!apiKey) {
      // Missing API key friendly notice helper
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: "Please enter your Google Gemini API Key in the Settings box above to connect with live Gemini intelligence. Once your key is provided, I can securely fetch real-time MySQL database inventory, alerts, requests, and donor profiles to formulate accurate, live answers for you." 
          }
        ]);
        setChatLoading(false);
      }, 800);
      return;
    }

    try {
      // 1. Fetch live MySQL DB telemetry in parallel
      let inventory = [];
      let donors = [];
      let requests = [];
      let alerts = [];

      try {
        const [invRes, donorsRes, reqRes, alertsRes] = await Promise.all([
          api.get('/api/inventory').catch(() => ({ data: { data: [] } })),
          api.get('/api/donors').catch(() => ({ data: { data: [] } })),
          api.get('/api/requests').catch(() => ({ data: { data: [] } })),
          api.get('/api/alerts').catch(() => ({ data: { data: [] } }))
        ]);

        inventory = invRes.data?.data || invRes.data || [];
        donors = donorsRes.data?.data || donorsRes.data || [];
        requests = reqRes.data?.data || reqRes.data || [];
        alerts = alertsRes.data?.data || alertsRes.data || [];
      } catch (dbErr) {
        console.warn("Failed to fetch database context, falling back to empty datasets:", dbErr);
      }

      // 2. Synthesize Context string for Gemini
      const liveDataPayload = { inventory, donors, requests, alerts };
      const systemPrompt = `You are an AI assistant for a Blood Bank Management System.
You have access to real-time data from the blood bank database.
Answer questions clearly and concisely. When stock is critical
(below 4 units), emphasize urgency. Format responses in plain
readable text, no markdown. Here is the current live data:
${JSON.stringify(liveDataPayload, null, 2)}`;

      // Map conversation history to Gemini parts format:
      const geminiContents = updatedHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // 3. Request Gemini response with auto-fallback cascade
      const reply = await fetchGeminiResponse(systemPrompt, geminiContents);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setChatError(err.message || 'API request failed. Make sure your Gemini API Key is valid and CORS is allowed by your network.');
    } finally {
      setChatLoading(false);
    }
  };

  // --- TAB 2: SCREENER LOGIC ---
  const handleScreenerAnswer = (value) => {
    const updatedAnswers = [...screenerAnswers];
    updatedAnswers[screenerStep] = value;
    setScreenerAnswers(updatedAnswers);

    if (screenerStep < 4) {
      setScreenerStep(screenerStep + 1);
    } else {
      // Last question answered - calculate medical verdict
      triggerScreenerAnalysis(updatedAnswers);
    }
  };

  const triggerScreenerAnalysis = async (answersList) => {
    setScreenerLoading(true);
    setScreenerStep(5); // Transition to submitting loading state
    setScreenerError('');

    if (!apiKey) {
      // API Key fallback logic (Mocks verdict if key is absent for clean demos)
      setTimeout(() => {
        const ageOk = answersList[0] === 'Yes';
        const weightOk = answersList[1] === 'Yes';
        const feverOk = answersList[2] === 'No';
        const donatedOk = answersList[3] === 'No';
        const medsOk = answersList[4] === 'No';

        const isEligible = ageOk && weightOk && feverOk && donatedOk && medsOk;
        let mockReason = '';

        if (isEligible) {
          mockReason = "Based on standard parameters: You are within the healthy age and weight limits and have no recent infections, blood loss, or interfering medication. (Google Gemini Key missing; showing standard heuristic screening).";
        } else {
          const blocks = [];
          if (!ageOk) blocks.push("Age must be between 18 and 65 years");
          if (!weightOk) blocks.push("Weight must be greater than 50 kg for safe volumes");
          if (!feverOk) blocks.push("Recent illnesses (cold/fever) restrict donation to protect recipients");
          if (!donatedOk) blocks.push("A minimum 3-month gap is required between consecutive blood donations");
          if (!medsOk) blocks.push("Current medications/antibiotics may interfere with recipient health");
          mockReason = `Based on standard parameters: Donation is restricted due to the following factors: ${blocks.join(', ')}. (Google Gemini Key missing; showing standard heuristic screening).`;
        }

        setScreenerVerdict({ eligible: isEligible, reason: mockReason });
        setScreenerStep(6);
        setScreenerLoading(false);
      }, 1200);
      return;
    }

    try {
      const systemPrompt = `You are a medical eligibility assistant for blood donation.
Based on the answers provided, determine if the person is
eligible to donate blood. Be direct — say ELIGIBLE or
NOT ELIGIBLE clearly at the start. Give a brief 2-line reason.
Be empathetic and encouraging.`;

      const userMessage = `Here are the answers:
1. Between 18 and 65: ${answersList[0]}
2. Weighs > 50 kg: ${answersList[1]}
3. Cold/Fever last 2 weeks: ${answersList[2]}
4. Donated last 3 months: ${answersList[3]}
5. Taking medications/antibiotics: ${answersList[4]}`;

      const contentsList = [{
        role: 'user',
        parts: [{ text: userMessage }]
      }];

      // Request Gemini response with auto-fallback cascade
      const textResponse = await fetchGeminiResponse(systemPrompt, contentsList);

      // Parse verdict from Gemini's plain readable text
      const eligible = textResponse.toUpperCase().includes("ELIGIBLE") && !textResponse.toUpperCase().includes("NOT ELIGIBLE");
      setScreenerVerdict({ eligible, reason: textResponse });
      setScreenerStep(6);
    } catch (err) {
      console.error(err);
      setScreenerError(err.message || 'Verification failed. Make sure your Gemini Key is valid.');
      setScreenerStep(0); // Reset screener
    } finally {
      setScreenerLoading(false);
    }
  };

  const handleResetScreener = () => {
    setScreenerStep(0);
    setScreenerAnswers([]);
    setScreenerVerdict(null);
    setScreenerError('');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="bb-page-title">AI Assistant</h1>
          <p className="bb-page-subtitle">Conversational companion and clinical donor eligibility screener powered by Google Gemini.</p>
        </div>

        {/* API Settings Trigger Button */}
        <button
          onClick={() => {
            setTempKey(apiKey);
            setTempModel(selectedModel);
            setShowKeySetting(!showKeySetting);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all duration-150 active:scale-95 ${
            showKeySetting 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-white border-app-border text-text-muted hover:bg-app-hover hover:text-text-primary'
          }`}
        >
          <span>🔑 {apiKey ? `API Configured (${selectedModel})` : 'Configure Gemini API'}</span>
        </button>
      </div>

      {/* API Key Configuration Dropdown Panel */}
      {showKeySetting && (
        <form onSubmit={handleSaveKey} className="bb-card p-6 border-red-100 bg-red-50/15 animate-smooth-slide-up space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Input 1: API Key */}
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-950">Google Gemini API Key</h4>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Stored securely inside your local browser's <code className="font-bold text-slate-700 bg-white px-1 py-0.5 border border-slate-200 rounded">localStorage</code>.
                </p>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="bb-input mt-0 font-mono text-xs w-full"
              />
            </div>

            {/* Input 2: Model Selector */}
            <div className="w-full md:w-64 space-y-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-950">Select Preferred Model</h4>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Fallback pipeline automatically retries others on error.
                </p>
              </div>
              <select
                value={tempModel}
                onChange={(e) => setTempModel(e.target.value)}
                className="bb-input mt-0 py-2.5 text-xs font-semibold w-full"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Stable)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Newest)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Analytical)</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end gap-2 border-t border-red-100/40 pt-4">
            {apiKey && (
              <button
                type="button"
                onClick={handleClearKey}
                className="px-4 py-2 bg-white border border-app-border text-text-muted text-xs font-semibold rounded-xl hover:bg-app-hover hover:text-text-primary transition-all active:scale-95 shadow-sm"
              >
                Clear Settings
              </button>
            )}
            <button
              type="submit"
              className="bb-button-primary text-xs px-6 py-2"
            >
              Save Settings
            </button>
          </div>
        </form>
      )}

      {/* Navigation Tabs Toggle */}
      <div className="flex border-b border-app-border">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all duration-200 -mb-[2px] ${
            activeTab === 'chat'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          💬 Live AI Chat
        </button>
        <button
          onClick={() => setActiveTab('screener')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all duration-200 -mb-[2px] ${
            activeTab === 'screener'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          📋 Donor Screener
        </button>
      </div>

      {/* --- TAB 1: LIVE AI CHAT --- */}
      {activeTab === 'chat' && (
        <div className="bb-card flex flex-col h-[calc(100vh-270px)] bg-white overflow-hidden relative">
          
          {/* Missing API Key Warning */}
          {!apiKey && (
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 text-xs text-amber-900 flex justify-between items-center animate-smooth-fade-in shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <span>Gemini API key is missing. Click the <strong>Configure Gemini API</strong> button above to get fully analyzed real-time reports.</span>
              </div>
            </div>
          )}

          {/* Messages Display Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-xl mx-auto space-y-6 py-8">
                <div className="w-16 h-16 bg-red-50 text-red-650 rounded-full flex items-center justify-center text-3xl shadow-inner animate-pulse">
                  🔮
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">Clinical Companion Chat</h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Hello! I am your real-time Clinical Database Companion. Ask me questions about database logs, inventories, blood stock thresholds, active donor clinics, or generate emergency notifications directly.
                  </p>
                </div>
                
                {/* Suggested question chips */}
                <div className="w-full space-y-2">
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Suggested Queries</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSendMessage(q)}
                        className="px-3.5 py-2 text-xs font-semibold bg-white border border-app-border rounded-xl text-text-muted hover:border-red-200 hover:text-accent hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-smooth-slide-up`}
                  >
                    <div 
                      className={`max-w-[75%] rounded-2xl px-4 py-3.5 text-xs leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-[#dc2626] text-white rounded-tr-none'
                          : 'bg-white border border-app-border text-text-primary rounded-tl-none font-medium'
                      }`}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-app-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                
                {chatError && (
                  <div className="p-4 bg-red-50 border border-red-150 rounded-2xl text-xs text-status-red text-center">
                    ❌ {chatError}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input Bar */}
          <div className="border-t border-app-border px-6 py-4 bg-white shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                placeholder="Ask Gemini about inventories, alerts, donors, requests..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={chatLoading}
                className="bb-input mt-0 flex-1 py-3 text-xs"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputValue.trim()}
                className="bb-button-primary px-6 flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 2: ELIGIBILITY SCREENER --- */}
      {activeTab === 'screener' && (
        <div className="max-w-2xl mx-auto">
          {screenerStep <= 4 && (
            <div className="bb-card p-8 bg-white space-y-8 animate-smooth-slide-up">
              
              {/* Progress Tracker bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Donor Screening Progress</span>
                  <span className="text-xs font-mono font-bold text-text-primary">Question {screenerStep + 1} of 5</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-500 ease-out" 
                    style={{ width: `${((screenerStep + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Screener Question Display */}
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center text-xl mx-auto shadow-inner">❓</div>
                <h3 className="text-lg font-extrabold text-text-primary tracking-tight px-4 leading-snug">
                  {SCREENER_QUESTIONS[screenerStep]}
                </h3>
              </div>

              {/* Large Yes/No click selectors */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleScreenerAnswer('Yes')}
                  className="py-4 rounded-2xl border border-app-border bg-white text-sm font-bold text-text-primary shadow-sm hover:border-[#dc2626] hover:bg-red-50/5 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleScreenerAnswer('No')}
                  className="py-4 rounded-2xl border border-app-border bg-white text-sm font-bold text-text-primary shadow-sm hover:border-[#dc2626] hover:bg-red-50/5 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Screener Loading Screen */}
          {screenerStep === 5 && (
            <div className="bb-card p-12 bg-white text-center space-y-6 animate-pulse">
              <div className="w-16 h-16 bg-red-50 text-red-650 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner animate-spin">🩸</div>
              <div>
                <h3 className="text-md font-bold text-text-primary">Calculating Medical Verdict...</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Gemini is evaluating your responses against standard clinical blood bank screening safety guidelines...
                </p>
              </div>
            </div>
          )}

          {/* Screener Result Report */}
          {screenerStep === 6 && screenerVerdict && (
            <div className="space-y-6 animate-smooth-slide-up">
              {screenerVerdict.eligible ? (
                // --- ELIGIBLE RESULT SCREEN ---
                <div className="bb-card border-emerald-100 bg-emerald-50/20 p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-[#059669] rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0">✓</div>
                    <div>
                      <h3 className="text-lg font-black text-emerald-950">You are eligible to donate blood!</h3>
                      <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider mt-0.5">Screener Pass Status</p>
                    </div>
                  </div>

                  <div className="border-t border-emerald-100/50 pt-4 text-xs text-emerald-900 leading-relaxed font-medium" style={{ whiteSpace: 'pre-line' }}>
                    {screenerVerdict.reason}
                  </div>

                  <div className="border-t border-emerald-100/50 pt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleResetScreener}
                      className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-700 text-xs font-bold hover:bg-emerald-50 active:scale-95 transition-all shadow-sm flex-1 sm:flex-none"
                    >
                      Clear Verdict
                    </button>
                    <button
                      onClick={() => navigate('/donors')}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md hover:shadow-emerald-500/10 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all flex-1"
                    >
                      Register as Donor →
                    </button>
                  </div>
                </div>
              ) : (
                // --- NOT ELIGIBLE RESULT SCREEN ---
                <div className="bb-card border-red-100 bg-red-50/20 p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 border border-red-100 text-[#dc2626] rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0">✕</div>
                    <div>
                      <h3 className="text-lg font-black text-red-950">You are not eligible to donate at this time</h3>
                      <p className="text-xs text-red-800 font-semibold uppercase tracking-wider mt-0.5">Screener Restrict Status</p>
                    </div>
                  </div>

                  <div className="border-t border-red-100/50 pt-4 text-xs text-red-900 leading-relaxed font-medium" style={{ whiteSpace: 'pre-line' }}>
                    {screenerVerdict.reason}
                  </div>

                  <div className="border-t border-red-100/50 pt-4 flex gap-3">
                    <button
                      onClick={handleResetScreener}
                      className="bb-button-primary flex-1 py-3"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {screenerError && (
            <div className="bb-card p-6 border-red-150 bg-red-50 text-center space-y-4 animate-smooth-slide-up">
              <p className="text-xs text-status-red font-semibold">❌ {screenerError}</p>
              <button
                onClick={handleResetScreener}
                className="bb-button-primary text-xs"
              >
                Reset Screener
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIAssistant;
