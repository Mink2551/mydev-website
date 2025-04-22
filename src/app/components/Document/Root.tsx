"use client";

import React, { useEffect, useState } from "react";
import { logActivity } from "../../components/console/logActivity";
import { getDatabase, ref, onValue, push, remove, update, set, get } from "firebase/database";
import { app } from "../../firebase/firebase";
import { auth } from './../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  FaFolder,
  FaArrowLeft,
  FaFileAlt,
  FaTrash,
  FaEdit,
  FaExchangeAlt,
  FaLock,
  FaLockOpen,
} from "react-icons/fa";

export interface Folder {
  id: string;
  name: string;
  type: "folder" | "file";
  locked?: boolean;
  password?: string;
  children?: Folder[];
}

export interface FolderMap {
  [path: string]: { id: string; path: string[]; name: string };
}

export type ModalType =
  | "file"
  | "folder"
  | "rename"
  | "confirmDelete"
  | "unlock"
  | "lock"
  | "move"
  | null;

export interface ModalState {
  type: ModalType;
  item?: Folder | null;
}

interface RootProps {
  onFileDoubleClick: (fileId: string) => void;
}

const Root: React.FC<RootProps> = ({ onFileDoubleClick }) => {
  const db = getDatabase(app);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [breadcrumbNames, setBreadcrumbNames] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [inputName, setInputName] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [moveDestinationInput, setMoveDestinationInput] = useState("");
  const [allFolders, setAllFolders] = useState<FolderMap>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user || null);
      });
  
      return () => unsubscribe();
    }, []);

  const pathToRef = (path: string[]) =>
    ref(db, "folders/" + path.join("/children/"));

  useEffect(() => {
    const dbRef = pathToRef(currentPath);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data)
          .filter(([_, value]: any) => value?.type === "folder" || value?.type === "file")
          .map(([key, value]: any) => ({ ...value, id: key })) as Folder[];
        setFolders(parsed);
      } else {
        setFolders([]);
      }
    });
    return () => unsubscribe();
  }, [currentPath]);

  // โหลดชื่อ breadcrumb สำหรับ path ปัจจุบัน
  useEffect(() => {
    const loadBreadcrumbNames = async () => {
      const paths: string[] = [];
      currentPath.forEach((id, index) => {
        if (index === 0) {
          paths.push(`folders/${id}`);
        } else {
          paths.push(`${paths[index - 1]}/children/${id}`);
        }
      });
  
      const promises = paths.map(async (path) => {
        const refPath = ref(db, path);
        const snapshot = await get(refPath);
        const data = snapshot.val();
        return data?.name || "unknown";
      });
  
      const names = await Promise.all(promises);
      setBreadcrumbNames(names);
    };
  
    if (currentPath.length > 0) {
      loadBreadcrumbNames();
    } else {
      setBreadcrumbNames([]);
    }
  }, [currentPath, db]);


  const handleEnterFolder = (folder: Folder) => {
    if (folder.type === "folder") {
      if (folder.locked) {
        setModal({ type: "unlock", item: folder });
        setInputPassword("");
        return;
      }
      setCurrentPath((prev) => [...prev, folder.id]);
    }
  };

  const handleBack = () => setCurrentPath((prev) => prev.slice(0, -1));

  const handleModalSubmit = () => {
    if (!inputName.trim()) return;
    const refPath = pathToRef(currentPath);

    if (modal.type === "folder") {
      const newFolder: Folder = { id: "", name: inputName, type: "folder", children: [] };
      push(refPath, newFolder);
      logActivity(currentUser.displayName, "Create folder", inputName);
    } else if (modal.type === "file") {
      const newFile: Folder = { id: "", name: inputName, type: "file" };
      push(refPath, newFile);
      logActivity(currentUser.displayName, "Create file", inputName);
    }

    setModal({ type: null });
    setInputName("");
  };

  const handleRenameSubmit = () => {
    if (!modal.item) return;
    if (modal.item.password && modal.item.password !== inputPassword) {
      alert("Incorrect password!");
      return;
    }
    const parentPath = currentPath.join("/children/");
    const itemRef = ref(db, `folders/${parentPath}/${modal.item.id}`);
    update(itemRef, { name: inputName });
    logActivity(currentUser.displayName, "Rename", inputName);
    setModal({ type: null });
    setInputName("");
    setInputPassword("");
  };

  const handleDeleteSubmit = async () => {
    if (!modal.item) return;
    if (modal.item.password && modal.item.password !== inputPassword) {
      alert("Incorrect password!");
      return;
    }
    // อ้างอิงไปยัง item ใน branch folders
    const itemRef = ref(db, `folders/${currentPath.join("/children/")}/${modal.item.id}`);
    // ลบ item ใน branch folders
    await remove(itemRef);
    
    // หากเป็นไฟล์ ให้ลบข้อมูล Note ที่เกี่ยวข้องด้วย (ใน branch notes และ files)
    if (modal.item.type === "file") {
      const noteRef = ref(db, `notes/${modal.item.id}`);
      const fileRef = ref(db, `files/${modal.item.id}`);
      await remove(noteRef);
      await remove(fileRef);
    }
    
    logActivity(currentUser.displayName, "Delete", modal.item.name);
    setModal({ type: null });
    setInputPassword("");
  };
  

  const handleMoveSubmit = () => {
    if (!modal.item) return;
    if (modal.item.password && modal.item.password !== inputPassword) {
      alert("Incorrect password!");
      return;
    }
    const path = moveDestinationInput.trim().replace(/^\/Root/, "");
    const destinationParts = path.split("/").filter(Boolean);
    const matched = Object.entries(allFolders).find(
      ([folderPath]) =>
        folderPath === `/Root${path ? "/" + destinationParts.join("/") : ""}`
    );
    if (!matched) {
      alert("Destination folder not found!");
      return;
    }
    const destinationPath = matched[1].path;
    const moveTargetPath = [...currentPath, modal.item.id];
    const isMovingIntoSelfOrChild =
      destinationPath.join("/") === moveTargetPath.join("/") ||
      destinationPath.join("/").startsWith(moveTargetPath.join("/") + "/");
    if (isMovingIntoSelfOrChild) {
      alert("Error: Cannot move folder into itself or its own subfolder.");
      return;
    }
    const sourceRef = ref(db, "folders/" + currentPath.join("/children/") + "/" + modal.item.id);
    const targetRef = ref(db, "folders/" + destinationPath.join("/children/"));
    onValue(
      sourceRef,
      (snapshot) => {
        const itemData = snapshot.val();
        if (itemData) {
          const newItemRef = push(targetRef);
          set(newItemRef, itemData);
          remove(sourceRef);
          logActivity(currentUser.displayName, "Move", inputName, {
            from: currentPath.join("/"),
            to: destinationPath.join("/")
          });
        }
      },
      { onlyOnce: true }
    );
    setModal({ type: null });
    setMoveDestinationInput("");
    setInputPassword("");
  };

  const handleToggleLock = (folder: Folder) => {
    if (folder.locked) {
      setModal({ type: "unlock", item: folder });
      setInputPassword("");
    } else {
      setModal({ type: "lock", item: folder });
      setInputPassword("");
    }
  };

  const handleLockSubmit = () => {
    if (!inputPassword.trim() || !modal.item) return;
    const parentPath = currentPath.join("/children/");
    const folderRef = ref(db, `folders/${parentPath}/${modal.item.id}`);
    update(folderRef, { locked: true, password: inputPassword });
    logActivity(currentUser.displayName, "Lock", inputName);
    setModal({ type: null });
    setInputPassword("");
  };

  const handleUnlockSubmit = () => {
    if (!modal.item) return;
    if (modal.item.password && modal.item.password !== inputPassword) {
      alert("Incorrect password!");
      return;
    }
    const parentPath = currentPath.join("/children/");
    const folderRef = ref(db, `folders/${parentPath}/${modal.item.id}`);
    update(folderRef, { locked: false, password: null });
    logActivity(currentUser.displayName, "Unlock", inputName);
    // เมื่อ unlock แล้วให้เข้าสู่ folder นั้น
    setCurrentPath((prev) => [...prev, modal.item!.id]);
    setModal({ type: null });
    setInputPassword("");
  };

  const loadAllFolders = (
    path: string[] = [],
    namePath: string[] = [],
    folderMap: FolderMap = {},
    callback?: (map: FolderMap) => void
  ) => {
    const refPath = pathToRef(path);
    onValue(
      refPath,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (path.length === 0) folderMap["/Root"] = { id: "", path: [], name: "Root" };
          Object.entries(data).forEach(([key, value]: any) => {
            if (value.type === "folder") {
              const newPath = [...path, key];
              const newNamePath = [...namePath, value.name];
              const displayPath = "/Root" + newNamePath.map((p) => `/${p}`).join("");
              folderMap[displayPath] = { id: key, path: newPath, name: value.name };
              loadAllFolders(newPath, newNamePath, folderMap, callback);
            }
          });
        }
        if (callback) callback(folderMap);
      },
      { onlyOnce: true }
    );
  };

  const handleOpenFile = (file: Folder) => {
    if (file.type === "file") {
      // เมื่อ double click ที่ไฟล์ ให้เรียก callback จาก Home ส่ง file.id ไป
      onFileDoubleClick(file.id);
    }
  };

  return (
    <div className="p-4 ml-14 text-white">
      <div className="flex items-center flex-wrap gap-2 mb-4">
        {currentPath.length > 0 && (
          <button onClick={handleBack} className="bg-gray-700 px-2 py-1 rounded">
            <FaArrowLeft />
          </button>
        )}
        <h2 className="text-xl font-bold">{currentPath.length === 0 ? "Root" : "Folder"}</h2>
        <div className="text-sm text-gray-400 ml-2 whitespace-nowrap overflow-x-auto">
          📁 Root{breadcrumbNames.map((name, idx) => (
            <span key={idx}> / {name}</span>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setModal({ type: "folder" })}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
          >
            + Folder
          </button>
          <button
            onClick={() => setModal({ type: "file" })}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
          >
            + File
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {folders.map((item) => (
          <div key={item.id} className="flex items-center justify-between hover:bg-gray-800 px-3 py-2 rounded">
            <div
              className="flex items-center cursor-pointer"
              onDoubleClick={() => {
                if (item.type === "folder") {
                  handleEnterFolder(item);
                } else {
                  handleOpenFile(item);
                }
              }}
            >
              {item.type === "folder" ? (
                <>
                  <FaFolder className="mr-2 text-yellow-400" />
                  {item.name}
                  {item.locked && <span className="ml-2 text-red-500">(Locked)</span>}
                </>
              ) : (
                <>
                  <FaFileAlt className="mr-2 text-gray-300" />
                  {item.name}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModal({ type: "rename", item });
                  setInputName(item.name);
                  setInputPassword("");
                }}
                className="hover:text-yellow-400"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => {
                  setModal({ type: "confirmDelete", item });
                  setInputPassword("");
                }}
                className="hover:text-red-500"
              >
                <FaTrash />
              </button>
              {item.type === "folder" && (
                <>
                  <button
                    onClick={() => {
                      setModal({ type: "move", item });
                      setMoveDestinationInput("");
                      setInputPassword("");
                      loadAllFolders([], [], {}, setAllFolders);
                    }}
                    className="hover:text-blue-400"
                  >
                    <FaExchangeAlt />
                  </button>
                  <button
                    onClick={() => handleToggleLock(item)}
                    className="hover:text-purple-400"
                  >
                    {item.locked ? <FaLock /> : <FaLockOpen />}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {modal.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded shadow-md w-96 space-y-4">
            {["folder", "file", "rename"].includes(modal.type) && (
              <>
                <h3 className="text-lg font-semibold">
                  {modal.type === "rename" ? "Rename" : `Create ${modal.type}`}
                </h3>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full p-2 bg-gray-800 rounded"
                  placeholder="Enter name"
                />
                {modal.type === "rename" && modal.item?.password && (
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full p-2 bg-gray-800 rounded"
                    placeholder="Enter password"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModal({ type: null })} className="text-gray-400">
                    Cancel
                  </button>
                  <button
                    onClick={
                      modal.type === "rename" ? handleRenameSubmit : handleModalSubmit
                    }
                    className="bg-blue-600 px-3 py-1 rounded"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}

            {modal.type === "confirmDelete" && (
              <>
                <h3 className="text-lg font-semibold">Confirm Delete</h3>
                {modal.item?.password && (
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full p-2 bg-gray-800 rounded"
                    placeholder="Enter password"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModal({ type: null })} className="text-gray-400">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSubmit}
                    className="bg-red-600 px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}

            {modal.type === "move" && (
              <>
                <h3 className="text-lg font-semibold">Move To</h3>
                <input
                  type="text"
                  value={moveDestinationInput}
                  onChange={(e) => setMoveDestinationInput(e.target.value)}
                  className="w-full p-2 bg-gray-800 rounded"
                  placeholder="/Root/target-folder"
                />
                {modal.item?.password && (
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full p-2 bg-gray-800 rounded"
                    placeholder="Enter password"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModal({ type: null })} className="text-gray-400">
                    Cancel
                  </button>
                  <button
                    onClick={handleMoveSubmit}
                    className="bg-blue-600 px-3 py-1 rounded"
                  >
                    Move
                  </button>
                </div>
              </>
            )}

            {modal.type === "lock" && (
              <>
                <h3 className="text-lg font-semibold">Set Password</h3>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full p-2 bg-gray-800 rounded"
                  placeholder="Password"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModal({ type: null })} className="text-gray-400">
                    Cancel
                  </button>
                  <button
                    onClick={handleLockSubmit}
                    className="bg-purple-600 px-3 py-1 rounded"
                  >
                    Lock
                  </button>
                </div>
              </>
            )}

            {modal.type === "unlock" && (
              <>
                <h3 className="text-lg font-semibold">Enter Password</h3>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full p-2 bg-gray-800 rounded"
                  placeholder="Password"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModal({ type: null })} className="text-gray-400">
                    Cancel
                  </button>
                  <button
                    onClick={handleUnlockSubmit}
                    className="bg-green-600 px-3 py-1 rounded"
                  >
                    Unlock
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Root;
