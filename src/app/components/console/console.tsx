"use client";

import React, { useState } from "react";
import { handleTerminalCommand } from "./handleTerminalCommand.ts"; // 👈 นำเข้า parser ที่เราเขียนไว้

interface ConsoleTerminalProps {
  onCommand: (action: { type: string; payload: any }) => void; // เปลี่ยนให้ส่ง action object
}

function ConsoleTerminal({ onCommand }: ConsoleTerminalProps) {
  const [commands, setCommands] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim() === "") return;
  
      const { logs, action } = handleTerminalCommand(input);
  
      // ✅ เคลียร์ log หาก logs ว่าง (เช่น /clear)
      if (logs.length === 0) {
        setCommands([]);
      } else {
        setCommands((prev) => [...prev, ...logs]);
      }
  
      if (action) {
        onCommand(action);
      }
  
      setInput("");
    }
  };  

  return (
    <div className="bg-black text-green-400 font-mono ml-14 p-4 min-h-screen overflow-auto">
      <h2 className="text-white text-lg mb-4">MyDev Console</h2>

      <div className="space-y-2">
        {commands.map((cmd, index) => (
          <div key={index}>
            <span className="text-green-600">user@console:</span>{" "}
            <span>{cmd}</span>
          </div>
        ))}

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
      </div>
    </div>
  );
}

export default ConsoleTerminal;
