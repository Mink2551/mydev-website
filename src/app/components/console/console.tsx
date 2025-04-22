"use client";

import React, { useState, useEffect } from "react";
import { handleTerminalCommand } from "./handleTerminalCommand.ts";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../firebase/firebase";

interface ConsoleTerminalProps {
  onCommand: (action: { type: string; payload: any }) => void;
}

interface FileSuggestion {
  name: string;
  noteId: string;
}

function ConsoleTerminal({ onCommand }: ConsoleTerminalProps) {
  const [commands, setCommands] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<FileSuggestion[]>([]);

  useEffect(() => {
    if (input.startsWith("Find ")) {
      const keyword = input.slice(5).trim().toLowerCase();
      if (keyword) {
        const db = getDatabase(app);
        const filesRef = ref(db, "files");
        onValue(
          filesRef,
          (snapshot) => {
            const data = snapshot.val();
            const results: FileSuggestion[] = [];
            if (data) {
              Object.entries(data).forEach(([id, value]: [string, any]) => {
                // ตรวจสอบทั้ง fileName และ name
                const title = value.fileName || value.name || "";
                if (title.toLowerCase().includes(keyword)) {
                  results.push({ name: title, noteId: id });
                }
              });
            }
            setSuggestions(results);
          },
          { onlyOnce: true }
        );
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!input.trim()) return;

      // ถ้าเป็นคำสั่ง Find และมี suggestion อยู่ ให้เลือก suggestion แรก
      if (input.startsWith("Find ") && suggestions.length > 0) {
        const suggestion = suggestions[0];
        setInput(`Find ${suggestion.name}`);
        const { logs } = handleTerminalCommand(`Find ${suggestion.name}`);
        setCommands((prev) => [...prev, ...logs]);
        onCommand({ type: "open_note", payload: suggestion.noteId });
        setInput("");
        setSuggestions([]);
        return;
      }

      const { logs, action } = handleTerminalCommand(input);
      if (logs.length === 0) {
        setCommands([]);
      } else {
        setCommands((prev) => [...prev, ...logs]);
      }
      if (action) {
        onCommand(action);
      }
      setInput("");
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: FileSuggestion) => {
    setInput(`Find ${suggestion.name}`);
    const { logs } = handleTerminalCommand(`Find ${suggestion.name}`);
    setCommands((prev) => [...prev, ...logs]);
    onCommand({ type: "open_note", payload: suggestion.noteId });
    setInput("");
    setSuggestions([]);
  };

  return (
    <div className="bg-black text-green-400 font-mono ml-14 p-4 min-h-screen overflow-auto relative">
      <h2 className="text-white text-lg mb-4">MyDev Console</h2>
      <div className="space-y-2">
        {commands.map((cmd, index) => (
          <div key={index}>
            <span className="text-green-600">user@console:</span>{" "}
            <span>{cmd}</span>
          </div>
        ))}
        <div className="flex flex-col relative">
          <div className="flex">
            <span className="text-green-600 mr-1">user@console:</span>
            <input
              type="text"
              className="bg-transparent border-none outline-none text-green-400 flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="Enter command..."
            />
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute bg-gray-800 border border-gray-600 mt-6 w-full z-10">
              {suggestions.map((s, index) => (
                <li
                  key={index}
                  className="px-2 py-1 hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsoleTerminal;
