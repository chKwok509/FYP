"use client";

import React, { useState, useEffect } from "react";
import "../globals.css";
import ReactMarkdown from "react-markdown";
import { features } from "process";
const user = Math.floor(Math.random() * 3864)

const user_fixed={
  Id:0,
  Features:{
    Sex: 0,
    Age: 18,
    Height: 1.68,
    Weight: 47.5,
    Hypertension: 0,
    Diabetes: 0,
    BMI: 16.8,
    Level_Obuse: 0,
    Level_Overweight: 0,
    Level_Underweight: 1,
    Fitness_Goal_Weight_Loss: 0
  }
}

const RecommendationPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input, user: user_fixed.Id ,context: context, user_features:user_fixed.Features}),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedMessage += chunk;

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage.role === "assistant") {
            return [
              ...prevMessages.slice(0, -1),
              { role: "assistant", content: accumulatedMessage },
            ];
          } else {
            return [...prevMessages, { role: "assistant", content: accumulatedMessage }];
          }
        });

      }
      if(accumulatedMessage!=='\n') setContext((prevContext) => [...prevContext, accumulatedMessage.trim()]);
      
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleRefresh = () => {
    window.location.reload();
    setContext([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      {/* Title */}
      <h1 className="text-3xl font-bold  text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
        Recommendation Assistant
      </h1>

      {/* Chat Area and Input */}
      <div className="w-full max-w-md space-y-5">
        {/* Chat Area */}
        <div className="bg-white/10 backdrop-blur-md h-[50vh] p-4 rounded-2xl border border-white/20 overflow-y-auto scrollbar">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-xl max-w-[80%] ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white/20 text-white"
                    } text-left`
                    }
              >
                {message.role === "user" ? (
                  message.content
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="text-left">
              <div className="inline-block p-3 rounded-xl bg-white/20 text-gray-400">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 active:scale-95 disabled:from-gray-400 disabled:to-gray-400"
            disabled={isLoading}
          >
            Send
          </button>
        </form>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handleBack}
            className="w-[48%] bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-2xl font-semibold text-lg shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 active:scale-95"
          >
            Back
          </button>
          <button
            onClick={handleRefresh}
            className="w-[48%] bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-2xl font-semibold text-lg shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-6">
        Powered by AI Technology
      </p>
    </div>
  );
};

export default RecommendationPage;