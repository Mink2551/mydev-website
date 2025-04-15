'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/firebase';
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  get,
  endBefore,
} from 'firebase/database';

interface LogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: number;
  target?: string;
  extra?: any;
}

function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;
  const [isPaginated, setIsPaginated] = useState(false); // เพื่อบอกว่าอยู่หน้าก่อนหน้า

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (before?: number) => {
    setLoading(true);
    const logsRef = ref(db, 'logs');

    const logsQuery = before
      ? query(logsRef, orderByChild('timestamp'), endBefore(before), limitToLast(pageSize))
      : query(logsRef, orderByChild('timestamp'), limitToLast(pageSize));

    const snapshot = await get(logsQuery);
    const data = snapshot.val();

    if (data) {
      const entries = Object.entries(data).map(([id, log]: any) => ({
        id,
        ...log,
      }));

      const sortedLogs = entries.sort((a, b) => b.timestamp - a.timestamp);

      setLogs(sortedLogs);
      setLastTimestamp(sortedLogs[sortedLogs.length - 1]?.timestamp || null);
      setIsPaginated(!!before); // ถ้ามี before แสดงว่าอยู่หน้าก่อนหน้า
    } else {
      setLogs([]);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 ml-14 w-[90vw] mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Log Activity</h1>

      {logs.length === 0 && !loading && (
        <p className="text-gray-400">ยังไม่มี logs</p>
      )}

      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-800 text-gray-200">
            <th className="border p-2">ลำดับ</th>
            <th className="border p-2">ผู้ใช้</th>
            <th className="border p-2">การกระทำ</th>
            <th className="border p-2">เวลา</th>
            <th className="border p-2">ดูเพิ่มเติม</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={log.id} className="hover:bg-gray-800">
              <td className="border p-2 text-center">{idx + 1}</td>
              <td className="border p-2">{log.user}</td>
              <td className="border p-2">{log.action}</td>
              <td className="border p-2">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => alert(JSON.stringify(log, null, 2))}
                  className="text-blue-400 hover:underline"
                >
                  ดูเพิ่มเติม
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-center gap-4">
        {isPaginated && (
          <button
            onClick={() => fetchLogs()}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
            disabled={loading}
          >
            ย้อนกลับ
          </button>
        )}

        {logs.length === pageSize && (
          <button
            onClick={() => fetchLogs(lastTimestamp!)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'กำลังโหลด...' : 'หน้าก่อนหน้า'}
          </button>
        )}
      </div>
    </div>
  );
}

export default Logs;
