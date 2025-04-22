import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { handleTerminalCommand } from "./handleTerminalCommand.ts";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../firebase/firebase";

interface FileSuggestion {
  name: string;
  noteId: string;
}

interface FloatingTerminalProps {
  onClose: () => void;
  onCommand: (action: { type: string; payload: any }) => void;
}

const FloatingTerminal: React.FC<FloatingTerminalProps> = ({ onClose, onCommand }) => {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.startsWith("Find ") && suggestions.length > 0) {
      const suggestion = suggestions[0];
      setInput(`Find ${suggestion.name}`);
      const { logs: newLogs } = handleTerminalCommand(`Find ${suggestion.name}`);
      setLogs((prev) => [...prev, ...newLogs]);
      onCommand({ type: "open_note", payload: suggestion.noteId });
      setInput("");
      setSuggestions([]);
      return;
    }
    const { logs: newLogs, action } = handleTerminalCommand(input);
    if (newLogs.length === 0) {
      setLogs([]);
    } else {
      setLogs((prev) => [...prev, ...newLogs]);
    }
    if (action) {
      onCommand(action);
    }
    setInput("");
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: FileSuggestion) => {
    setInput(`Find ${suggestion.name}`);
    const { logs: newLogs } = handleTerminalCommand(`Find ${suggestion.name}`);
    setLogs((prev) => [...prev, ...newLogs]);
    onCommand({ type: "open_note", payload: suggestion.noteId });
    setInput("");
    setSuggestions([]);
  };

  return (
    <>
      <motion.div
        drag
        dragConstraints={{ top: -1000, bottom: 1000, left: -1000, right: 1000 }}
        className="fixed bottom-10 right-10 z-50 w-[300px] md:w-[400px] bg-black border border-gray-600 rounded-lg shadow-lg overflow-hidden text-white"
      >
        <div className="flex justify-between items-center bg-gray-800 px-3 py-2 text-sm font-bold cursor-move">
          <span>Floating Terminal</span>
          <button onClick={onClose}>
            <FaTimes className="text-red-400 hover:text-red-600" />
          </button>
        </div>
        <div className="h-64 p-2 overflow-y-auto text-sm font-mono bg-[#111] border-t border-gray-700">
          {logs.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex border-t border-gray-600">
          <input
            type="text"
            className="flex-1 px-3 py-2 bg-black text-white outline-none text-sm"
            placeholder="Type command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="px-4 bg-[#169976] hover:bg-green-600 text-white">
            Run
          </button>
        </form>
      </motion.div>

      {/* Modal window for suggestions (แสดงแยกออกมานอก Floating Terminal) */}
      {suggestions.length > 0 && (
        <motion.div
          drag
          dragConstraints={{ top: -1000, bottom: 1000, left: -1000, right: 1000 }}
          className="fixed bottom-100 right-10 z-50 w-[300px] text-white bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-xl"
        >
          <div className="flex justify-between items-center bg-gray-800 px-3 py-2 text-sm font-bold cursor-move rounded-t-lg">
            <span>Auto Complete</span>
            <button onClick={() => setSuggestions([])}>
              <FaTimes className="text-red-400 hover:text-red-600" />
            </button>
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {suggestions.map((s, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-t border-gray-700"
                onClick={() => handleSuggestionClick(s)}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </>
  );
};

export default FloatingTerminal;
