import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { handleTerminalCommand } from "./handleTerminalCommand.ts";

interface FloatingTerminalProps {
  onClose: () => void;
  onCommand: (action: { type: string; payload: any }) => void; // ✅ รับ onCommand
}

const FloatingTerminal: React.FC<FloatingTerminalProps> = ({ onClose, onCommand }) => {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const { logs: newLogs, action } = handleTerminalCommand(input);
  setLogs(newLogs);

    if (action) {
      onCommand(action); // ✅ เรียกใช้ onCommand ที่ส่งจาก Home
    }

    setInput("");
  };

  return (
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
      <form onSubmit={handleCommand} className="flex border-t border-gray-600">
        <input
          type="text"
          className="flex-1 px-3 py-2 bg-black text-white outline-none text-sm"
          placeholder="Type command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 bg-[#169976] hover:bg-green-600 text-white"
        >
          Run
        </button>
      </form>
    </motion.div>
  );
};

export default FloatingTerminal;
