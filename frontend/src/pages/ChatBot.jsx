// src/pages/YouthCareerChatBot.jsx

import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Hard-coded Gemini API key (as requested)
const GEMINI_API_KEY = "AIzaSyDPmJ7Yfu5a531VY08JWFjDUVET6cFpDeo";

// Gemini text model (v1beta, text-only)
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const YouthCareerChatBot = () => {
  const auth = getAuth();
  const db = getFirestore();

  const [messages, setMessages] = useState([]); // { role: 'user'|'bot', text: string }[]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = auth.currentUser;

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  // Call Gemini API with strict domain restriction
  const callGemini = async (userText) => {
    const prompt = `
You are "YouthCareerBot", a specialized chatbot that ONLY answers questions related to:

- Youth career development
- Skill development
- Education and training for employability
- Job search, CV, interviews, internships
- Entrepreneurship and income opportunities for young people
- SDG 8: Decent Work and Economic Growth (including topics like decent jobs, youth unemployment, fair wages, work conditions, economic growth, productivity, innovation, etc.)

Strict rules:
- If the user's question is NOT clearly related to these themes, respond with EXACTLY this single token: OUT_OF_SCOPE
  (all caps, no extra words, no punctuation, no explanation).
- If it IS related, give a clear, helpful, and practical answer for young people, especially in career and skills.

User question:
"${userText}"
`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Gemini error:", errData);
      throw new Error(errData.error?.message || "Gemini API request failed");
    }

    const data = await res.json();

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("") || "";

    return text.trim();
  };

  // Save conversation pair to Firestore
  const saveChatToFirestore = async (userText, botText) => {
    if (!currentUser?.email) return;

    const email = currentUser.email;
    const docRef = doc(db, "ChatBot", email);
    const snap = await getDoc(docRef);

    let nextIndex = 1;

    if (snap.exists()) {
      const data = snap.data() || {};
      const prefix = `${email}_msz_`;

      const indices = Object.keys(data)
        .filter((key) => key.startsWith(prefix))
        .map((key) => {
          const numStr = key.replace(prefix, "");
          const n = parseInt(numStr, 10);
          return isNaN(n) ? null : n;
        })
        .filter((n) => n !== null);

      if (indices.length > 0) {
        nextIndex = Math.max(...indices) + 1;
      }
    }

    const updatePayload = {};
    updatePayload[`${email}_msz_${nextIndex}`] = userText;
    updatePayload[`bot_msz_${nextIndex}`] = botText;

    await setDoc(docRef, updatePayload, { merge: true });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = input.trim();
    if (!trimmed) return;

    if (!currentUser) {
      setError("You must be logged in to chat with the bot.");
      return;
    }

    const userMsg = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const rawResponse = await callGemini(trimmed);

      let botText;

      if (rawResponse === "OUT_OF_SCOPE") {
        // Bot refuses to answer non-youth-career/SDG8 questions
        botText =
          "I can only answer questions related to youth career, skill development, and SDG 8 (Decent Work and Economic Growth). Please ask something in that area.";
      } else {
        botText = rawResponse;
      }

      const botMsg = { role: "bot", text: botText };
      setMessages((prev) => [...prev, botMsg]);

      // Save to Firestore in requested format
      await saveChatToFirestore(trimmed, botText);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex justify-center py-8 px-4 bg-bg-muted dark:bg-gray-900">
      <div className="max-w-3xl w-full card p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-2">
          Youth Career & SDG 8 ChatBot
        </h1>
        <p className="text-sm text-text-muted mb-4">
          Ask me about youth careers, skill development, jobs, internships,
          entrepreneurship, and SDG 8 (Decent Work and Economic Growth).
          <br />
          I will not answer questions outside these topics.
        </p>

        {/* Chat window */}
        <div className="flex-1 border rounded-md p-3 mb-4 overflow-y-auto max-h-[480px] bg-white/50 dark:bg-gray-800/60">
          {messages.length === 0 && (
            <p className="text-sm text-text-muted">
              Start by asking something like:{" "}
              <em>“How can a university student build skills for SDG 8 jobs?”</em>
            </p>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 p-2 rounded-md bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            className="flex-1 input-field"
            placeholder="Ask about youth careers, skills, SDG 8..."
            value={input}
            onChange={handleChange}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default YouthCareerChatBot;
