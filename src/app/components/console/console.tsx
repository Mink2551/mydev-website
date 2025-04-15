"use client";

import React, { useState } from "react";

interface ConsoleTerminalProps {
  onCommand: (command: string) => void; // เพิ่ม props สำหรับส่งคำสั่ง
}

function ConsoleTerminal({ onCommand }: ConsoleTerminalProps) {
  const [commands, setCommands] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (input.trim() !== "") {
        setCommands((prev) => [...prev, input]);
        onCommand(input); // ส่งคำสั่งไปที่ Home
        if (input === "/help") {
          setCommands((prev) => [...prev, "Available commands: /help, /clear"]);
        } else if (input === "/clear") {
          setCommands([]);
        }
        setInput("");
      }
    }
  };

  return (
    <div className="bg-black text-green-400 font-mono ml-14 p-4 min-h-screen overflow-auto">
      <h2 className="text-white text-lg mb-4">MyDev Console</h2>

      <div className="space-y-2">
        {commands.map((cmd, index) => (
          <div key={index}>
            <span className="text-green-600">user@console:</span> <span>{cmd}</span>
          </div>
        ))}

        {/* Input */}
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
