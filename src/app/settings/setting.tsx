"use client";

import React from "react";

interface SettingProps {
  onToggleTerminal: () => void;
  isTerminalVisible: boolean;
}

const Setting: React.FC<SettingProps> = ({ onToggleTerminal, isTerminalVisible }) => {
  return (
    <div className="p-4 ml-14 space-y-4">
      <h2 className="text-xl font-bold text-[#169976]">Settings</h2>
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
        <p className="text-white">Floating Terminal</p>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isTerminalVisible}
            onChange={onToggleTerminal}
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </label>
      </div>
    </div>
  );
};

export default Setting;
