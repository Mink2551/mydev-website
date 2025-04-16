import {
  getDatabase,
  ref,
  onValue,
  update,
} from "firebase/database";
import { app } from "../../firebase/firebase";

interface TerminalAction {
  logs: string[];
  action?: {
    type: string;
    payload: any;
  };
}

/**
 * normalizePath: ปรับ path ให้อยู่ในรูปมาตรฐาน โดยแทนที่ /root หรือ /Root ด้วย "/Root"
 */
function normalizePath(path: string): string {
  return path.replace(/^\/?[Rr]oot/, "/Root");
}

export function handleTerminalCommand(input: string): TerminalAction {
  const logs: string[] = [`> ${input}`];
  const parts = input.trim().split(" ");
  const command = parts[0];
  const db = getDatabase(app);

  // ====================
  // [1] Command: /help
  // ====================
  if (command === "/help") {
    logs.push("Available commands:");
    logs.push("- /help");
    logs.push("- /clear");
    logs.push('- FloatConsole:True / FloatConsole:False');
    logs.push('- Lock <Path> <Password>');
    logs.push('- Unlock <Path> <Password>');
    return { logs };
  }

  // ====================
  // [2] Command: /clear
  // ====================
  if (command === "/clear") return { logs: [] };

  // ===============================
  // [3] Command: FloatConsole:<True|False>
  // ===============================
  if (command === "FloatConsole:True") {
    logs.push("✅ Floating console enabled.");
    return {
      logs,
      action: {
        type: "toggle_terminal",
        payload: { visible: true },
      },
    };
  }
  if (command === "FloatConsole:False") {
    logs.push("❌ Floating console disabled.");
    return {
      logs,
      action: {
        type: "toggle_terminal",
        payload: { visible: false },
      },
    };
  }

  // ===============================
  // [4] Command: Lock <Path> <Password>
  // ===============================
  if (command === "Lock") {
    if (parts.length < 3) {
      logs.push("Usage: Lock <Path> <Password>");
      return { logs };
    }
    const path = normalizePath(parts[1]);
    const password = parts.slice(2).join(" ");
    // เปลี่ยน path เป็น path สำหรับ Firebase (แปลง / เป็น /children/ หลังจาก /Root)
    const firebasePath = "folders" + path.split('/').map((p, idx) => {
      return idx === 0 ? "" : `/children/${p}`;
    }).join('');
    const folderRef = ref(db, firebasePath);
    update(folderRef, { locked: true, password: password });
    logs.push(`Folder ${path} locked.`);
    return { logs };
  }

  // ==================================
  // [5] Command: Unlock <Path> <Password>
  // ==================================
  if (command === "Unlock") {
    if (parts.length < 3) {
      logs.push("Usage: Unlock <Path> <Password>");
      return { logs };
    }
    const path = normalizePath(parts[1]);
    const password = parts.slice(2).join(" ");
    const firebasePath = "folders" + path.split('/').map((p, idx) => {
      return idx === 0 ? "" : `/children/${p}`;
    }).join('');
    const folderRef = ref(db, firebasePath);
    onValue(
      folderRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data && data.locked) {
          if (data.password === password) {
            update(folderRef, { locked: false, password: null });
            logs.push(`Folder ${path} unlocked.`);
          } else {
            logs.push("Incorrect password.");
          }
        } else {
          logs.push("Folder is not locked or does not exist.");
        }
      },
      { onlyOnce: true }
    );
    return { logs };
  }

  // ==========================
  // [Fallback] Unknown command
  // ==========================
  logs.push("❓ Command not found.");
  return { logs };
}
