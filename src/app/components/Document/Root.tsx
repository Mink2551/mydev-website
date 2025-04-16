"use client";

import React, { useEffect, useState } from "react";
import { logActivity } from "../../components/console/logActivity";
import { getDatabase, ref, onValue, push, remove, update, set } from "firebase/database";
import { app } from "../../firebase/firebase";
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

      const promises = paths.map(
        (path) =>
          new Promise<string>((resolve) => {
            const refPath = ref(db, path);
            onValue(
              refPath,
              (snapshot) => {
                const data = snapshot.val();
                resolve(data?.name || "...");
              },
              { onlyOnce: true }
            );
          })
      );

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
      logActivity("Anonymous", "Create folder", inputName);
    } else if (modal.type === "file") {
      const newFile: Folder = { id: "", name: inputName, type: "file" };
      push(refPath, newFile);
      logActivity("Anonymous", "Create file", inputName);
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
    logActivity("Anonymous", "Rename", inputName);
    setModal({ type: null });
    setInputName("");
    setInputPassword("");
  };

  const handleDeleteSubmit = () => {
    if (!modal.item) return;
    if (modal.item.password && modal.item.password !== inputPassword) {
      alert("Incorrect password!");
      return;
    }
    const itemRef = ref(db, `folders/${currentPath.join("/children/")}/${modal.item.id}`);
    remove(itemRef);
    logActivity("Anonymous", "Delete", inputName);
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
          logActivity("Anonymous", "Move", inputName, {
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
    logActivity("Anonymous", "Lock", inputName);
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
    logActivity("Anonymous", "Unlock", inputName);
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
              <button
                onClick={() => {
                  setModal({ type: "move", item });
                  setMoveDestinationInput("");
                  setInputPassword("");
                  setAllFolders({});
                  loadAllFolders([], [], {}, setAllFolders);
                }}
                className="hover:text-blue-400"
              >
                <FaExchangeAlt />
              </button>
              {item.type === "folder" && (
                <button onClick={() => handleToggleLock(item)} className="hover:text-purple-500">
                  {item.locked ? <FaLockOpen /> : <FaLock />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal.type && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-80 text-center max-h-[80vh] overflow-y-auto">
            {modal.type === "folder" || modal.type === "file" ? (
              <>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-4"
                  placeholder="Enter name"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                />
                <div className="flex justify-center gap-4">
                  <button onClick={handleModalSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    OK
                  </button>
                  <button onClick={() => setModal({ type: null })} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                    Cancel
                  </button>
              </div>
              </>
            ) : modal.type === "rename" ? (
              <>
                <p className="mb-4">Enter new name for <strong>{modal.item?.name}</strong>:</p>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-2"
                  placeholder="New name"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                />
                {modal.item?.password && (
                  <input
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-4"
                    placeholder="Enter password"
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                  />
                )}
                <div className="flex justify-center gap-4">
                  <button onClick={handleRenameSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    OK
                  </button>
                  <button onClick={() => { setModal({ type: null }); setInputPassword(""); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </>
            ) : modal.type === "confirmDelete" ? (
              <>
                <p className="mb-4">Are you sure you want to delete <strong>{modal.item?.name}</strong>?</p>
                {modal.item?.password && (
                  <input
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-4"
                    placeholder="Enter password"
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                  />
                )}
                <div className="flex justify-center gap-4">
                  <button onClick={handleDeleteSubmit} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                    Delete
                  </button>
                  <button onClick={() => { setModal({ type: null }); setInputPassword(""); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </>
            ) : modal.type === "move" ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Move "{modal.item?.name}" to...</h3>
                <input
                  type="text"
                  placeholder="/Root/Folder1/Folder2"
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-2"
                  value={moveDestinationInput}
                  onChange={(e) => setMoveDestinationInput(e.target.value)}
                />
                {modal.item?.password && (
                  <input
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-4"
                    placeholder="Enter password"
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                  />
                )}
                <div className="flex justify-center gap-4">
                  <button onClick={handleMoveSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    Confirm
                  </button>
                  <button onClick={() => { setModal({ type: null }); setInputPassword(""); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </>
            ) : modal.type === "lock" ? (
              <>
                <p className="mb-4">Enter password to lock <strong>{modal.item?.name}</strong>:</p>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-4"
                  placeholder="Set password"
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                />
                <div className="flex justify-center gap-4">
                  <button onClick={handleLockSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    Lock
                  </button>
                  <button onClick={() => { setModal({ type: null }); setInputPassword(""); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </>
            ) : modal.type === "unlock" ? (
              <>
                <p className="mb-4">Enter password to unlock <strong>{modal.item?.name}</strong>:</p>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white mb-4"
                  placeholder="Enter password"
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                />
                <div className="flex justify-center gap-4">
                  <button onClick={handleUnlockSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    Unlock
                  </button>
                  <button onClick={() => { setModal({ type: null }); setInputPassword(""); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                    Cancel
                  </button>
              </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Root;
