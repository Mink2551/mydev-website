"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./components/navigations/navbar";
import Sidebar from "./components/navigations/sidebar";
import Register from "./components/auth/register";
import Profile from "./components/auth/profile";
import Logs from "./components/console/logs";
import Console from "./components/console/console";
import Setting from "./settings/setting";
import FloatingTerminal from "./components/console/floatingTerminal";
import Root from "./components/Document/Root";
import Note from "./components/Document/note";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Home() {
  const [pageState, setPageState] = useState<string>("overview");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [floatingTerminalVisible, setFloatingTerminalVisible] = useState<boolean>(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

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
    setFloatingTerminalVisible((prev) => !prev);
  };

  // Callback เมื่อ double click ที่ไฟล์ใน Root Component
  const handleFileDoubleClick = (fileId: string) => {
    setSelectedNoteId(fileId);
    setPageState("Note");
  };

  // ตัวอย่าง handler สำหรับคำสั่งที่ส่งมาจาก Floating Terminal (ถ้ามี)
  const handleConsoleCommand = (action: { type: string; payload: any }) => {
    switch (action.type) {
      case "toggle_terminal":
        setFloatingTerminalVisible(action.payload.visible);
        break;
      case "create_folder":
        console.log("Create folder:", action.payload);
        break;
      case "create_note":
        console.log("Create note:", action.payload);
        break;
      case "remove_folder":
        console.log("Remove folder:", action.payload);
        break;
      case "remove_note":
        console.log("Remove note:", action.payload);
        break;
      case "move_folder":
        console.log("Move folder:", action.payload);
        break;
      case "move_note":
        console.log("Move note:", action.payload);
        break;
      case "rename_note":
        console.log("Rename note:", action.payload);
        break;
      default:
        console.warn("Unknown command:", action);
    }
  };

  return (
    <main className="min-h-[100vh]">
      <Navbar />
      <Sidebar pageState={pageState} setPageState={setPageState} />

      {floatingTerminalVisible && (
        <FloatingTerminal
          onClose={toggleTerminal}
          onCommand={handleConsoleCommand}
        />
      )}

      {pageState === "overview" ? (
        <div className="text-white">Overview</div>
      ) : pageState === "Log" ? (
        <div className="text-white">
          <Logs />
        </div>
      ) : pageState === "Consoles" ? (
        <div className="text-white">
          <Console onCommand={handleConsoleCommand} />
        </div>
      ) : pageState === "Note" ? (
        <div className="text-white ">
          <Note noteId={selectedNoteId} />
        </div>
      ) : pageState === "Documents" ? (
        <div className="text-white">
          {/* ส่ง callback handleFileDoubleClick เข้าไปเพื่อรับ file id เมื่อ double click */}
          <Root onFileDoubleClick={handleFileDoubleClick} />
        </div>
      ) : pageState === "profile" ? (
        <div className="text-white">
          <Profile />
        </div>
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
