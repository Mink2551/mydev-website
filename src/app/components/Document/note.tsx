"use client";

import React, { useEffect, useRef, useState } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { app } from "../../firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import toast, { Toaster } from "react-hot-toast";

interface NoteProps {
  noteId: string | null;
}

type Mode = "read" | "write";

const Note: React.FC<NoteProps> = ({ noteId }) => {
  const db = getDatabase(app);
  const [noteData, setNoteData] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("read");
  const [lastEdited, setLastEdited] = useState<string>("");
  const [fileName, setFileName] = useState<string>("Untitled Note");
  const editorRef = useRef<HTMLDivElement>(null);

  // โหลดข้อมูล Note เมื่อ noteId เปลี่ยนแปลง
  useEffect(() => {
    if (!noteId) return;
    const noteRef = ref(db, `notes/${noteId}`);
    const unsubscribe = onValue(noteRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNoteData(data);
        if (data.fileName) {
          setFileName(data.fileName);
        }
        if (data.lastEdited) {
          setLastEdited(new Date(data.lastEdited).toLocaleString());
        }
      }
    });
    return () => unsubscribe();
  }, [noteId, db]);

  useEffect(() => {
    // เมื่อเปลี่ยนเป็นโหมดเขียน (write) ให้อัปเดท editor ด้วยข้อมูล noteData
    if (mode === "write" && editorRef.current && noteData) {
      editorRef.current.innerHTML = noteData.content || "";
    }
  }, [mode, noteData]);

  const toggleMode = () => {
    if (mode === "read") {
      setMode("write");
    } else {
      setMode("read");
    }
  };

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const insertCodeBox = () => {
    if (!editorRef.current) return;
    const codeBlockHTML = `
      <div style="position: relative; margin: 8px 0 4px;">
        <pre contenteditable="true"
          style="background-color: #2d2d2d; color: #f8f8f2; padding: 16px; border-radius: 6px; font-family: 'Fira Code', monospace; box-shadow: 0 2px 10px rgba(0,0,0,0.2); overflow-x: auto; white-space: nowrap; min-height: 20px; line-height: 1.5;">Enter code here...
        </pre>
        <button contenteditable="false"
          onclick="(function(btn){
            const code = btn.previousElementSibling?.innerText;
            navigator.clipboard.writeText(code).then(() => {
              btn.innerText = 'Copied!';
              setTimeout(() => btn.innerText = '📋 Copy', 1500);
            });
          })(this)"
          style="position: absolute; top: 8px; right: 8px; background-color: rgba(0,0,0,0.6); color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; z-index: 10; user-select: none;">
          📋 Copy
        </button>
      </div>`;
    handleCommand("insertHTML", codeBlockHTML);
  };

  const handleSave = async () => {
    if (!noteId || !editorRef.current) return;
    const newContent = editorRef.current.innerHTML;
    const noteRef = ref(db, `notes/${noteId}`);
    const timestamp = Date.now();
    try {
      // อัปเดททั้งเนื้อหา, lastEdited และ Note title (fileName) ใน notes branch
      await update(noteRef, { content: newContent, lastEdited: timestamp, fileName: fileName });
      // อัปเดท Note title ใน files branch
      await update(ref(db, `files/${noteId}`), { fileName: fileName });
      setLastEdited(new Date(timestamp).toLocaleString());
      toast.success("Note saved!");
      setMode("read");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save note.");
    }
  };  

  return (
    <div className="p-6 ml-14 relative min-h-screen bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-4 border-b pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        {mode === "write" ? (
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="text-3xl font-bold bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500"
          />
        ) : (
          <h1 className="text-3xl font-bold">{fileName}</h1>
        )}
        {lastEdited && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last Edited: {lastEdited}
          </span>
        )}
      </div>

      {/* Toggle Mode Button */}
      <div className="justify-end mb-4 flex">
        <button
          onClick={toggleMode}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          {mode === "read" ? "Switch to Write Mode" : "Switch to Read Mode"}
        </button>
      </div>

      {mode === "write" ? (
        <div className="mt-12">
          {/* Text Formatting Controls */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleCommand("bold")}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
            >
              Bold
            </button>
            <button
              onClick={() => handleCommand("italic")}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
            >
              Italic
            </button>
            <button
              onClick={() => handleCommand("underline")}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
            >
              Underline
            </button>
            <select
              onChange={(e) => handleCommand("fontSize", e.target.value)}
              defaultValue="3"
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
            >
              <option value="1">Small</option>
              <option value="3">Normal</option>
              <option value="5">Large</option>
              <option value="7">Extra Large</option>
            </select>
  
            {/* Add Color Picker */}
            <input
              type="color"
              onChange={(e) => handleCommand("foreColor", e.target.value)}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
            />
  
            {/* Add Highlight Color */}
            <input
              type="color"
              onChange={(e) => handleCommand("backColor", e.target.value)}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
            />
  
            <button
              onClick={insertCodeBox}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
            >
              Code Box
            </button>
          </div>
  
          <div
            ref={editorRef}
            className="border border-gray-300 dark:border-gray-500 p-6 min-h-[250px] max-h-[600px] overflow-auto rounded shadow-inner bg-white dark:bg-gray-800"
            contentEditable
          ></div>
  
          <div className="mt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Save Note
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-12">
          <div
            className="mt-4 p-6 border rounded shadow-sm bg-gray-50 dark:bg-gray-700 overflow-auto"
            dangerouslySetInnerHTML={{
              __html: noteData?.content || "No content available.",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Note;
