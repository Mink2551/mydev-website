"use client";

import Navbar from "./components/navigations/navbar";
import React, { useState, useEffect } from "react";
import Sidebar from "./components/navigations/sidebar";
import Register from "./components/auth/register";
import Profile from "./components/auth/profile";
import { auth } from './firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Logs from "./components/console/logs";
import Console from "./components/console/console";
import Setting from "./settings/setting";
import FloatingTerminal from "./components/console/floatingTerminal";

export default function Home() {
  const [pageState, setPageState] = useState<string>("overview");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [floatingTerminalVisible, setFloatingTerminalVisible] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setPageState("profile");
      } else {
        setCurrentUser(null);
        setPageState("register");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleProfileClick = () => {
    setPageState("profile");
  };

  const toggleTerminal = () => {
    setFloatingTerminalVisible((prev) => !prev);  // Toggle terminal visibility
  };

  // ฟังก์ชันที่รับคำสั่งจาก ConsoleTerminal
  const handleConsoleCommand = (command: string) => {
    if (command === "FloatControl:True") {
      setFloatingTerminalVisible(true);  // แสดง FloatingTerminal
    } else if (command === "FloatControl:False") {
      setFloatingTerminalVisible(false);  // ซ่อน FloatingTerminal
    }
  };

  return (
    <main className="min-h-[100vh]">
      <Navbar />
      <Sidebar pageState={pageState} setPageState={setPageState} />

      {/* Floating Terminal */}
      {floatingTerminalVisible && <FloatingTerminal onClose={toggleTerminal} />}

      {pageState === "overview" ? (
        <div className="text-white">Overview</div>
      ) : pageState === "Log" ? (
        <div className="text-white"><Logs /></div>
      ) : pageState === "Consoles" ? (
        <div className="text-white"><Console onCommand={handleConsoleCommand} /></div>
      ) : pageState === "Note" ? (
        <div className="text-white">Note</div>
      ) : pageState === "Documents" ? (
        <div className="text-white">Documents</div>
      ) : pageState === "profile" ? (
        <div className="text-white"><Profile /></div>
      ) : pageState === "register" ? (
        <div className="text-white">
          <Register />
          <button onClick={handleProfileClick} className="mt-4 text-blue-500">
            Go to Profile
          </button>
        </div>
      ) : pageState === "settings" ? (
        <div className="text-white">
          <Setting 
            onToggleTerminal={toggleTerminal} 
            isTerminalVisible={floatingTerminalVisible} 
          />
        </div>
      ) : null}
    </main>
  );
}
