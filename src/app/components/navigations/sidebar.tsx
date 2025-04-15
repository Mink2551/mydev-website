"use client"

import React, { useState } from 'react';
import { FaHome, FaUserAlt, FaCog, FaBook } from 'react-icons/fa';
import { MdDisplaySettings } from "react-icons/md";
import { CiStickyNote } from "react-icons/ci";
import { VscDebugConsole } from "react-icons/vsc";

type SidebarProps = {
  pageState: string;
  setPageState: (state: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ pageState, setPageState }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuItems = [
    { name: 'Overview', icon: <FaHome />, key: 'overview' },
    { key: 'Line', label: 'Documents' },
    { name: 'Logs', icon: <MdDisplaySettings />, key: 'Log' },
    { name: 'Consoles', icon: <VscDebugConsole />, key: 'Consoles' },
    { key: 'Line' },
    { name: 'Notes', icon: <CiStickyNote />, key: 'Note' },
    { name: 'Documents', icon: <FaBook />, key: 'Documents' },
    { key: 'Line', label: 'Settings' },
    { name: 'Profile', icon: <FaUserAlt />, key: 'profile' },
    { name: 'Settings', icon: <FaCog />, key: 'settings' },
  ];

  return (
    <div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className={`h-screen bg-[#222222] text-gray-500 fixed border-r border-gray-600 transition-all duration-300 ease-in-out ${isOpen ? 'w-48' : 'w-14'}`}
    >
      <div className="flex flex-col p-2 space-y-2">
        {menuItems.map((item, index) => {
          if (item.key === 'Line') {
            return (
              <div key={`line-${index}`} className="mt-2.5 mb-2.5">
                {item.label && isOpen && (
                  <div className="text-xs text-gray-400 pl-2 mb-1">{item.label}</div>
                )}
                <hr className="border-gray-600" />
              </div>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => setPageState(item.key)}
              className={`flex items-center px-2 py-2 h-10 rounded-lg hover:bg-gray-300/20 hover:text-gray-200 transition-all duration-200 ${
                pageState === item.key ? 'bg-gray-300/20 text-gray-200' : ''
              }`}
            >
              <span className={`text-xl ${isOpen ? '' : 'mx-auto'}`}>{item.icon}</span>
              {isOpen && <span className="ml-3 text-sm">{item.name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
