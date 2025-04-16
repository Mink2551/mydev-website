// logActivity.ts
import { ref, push } from 'firebase/database';
import { db } from '../../firebase/firebase'; // ปรับ path ตามโปรเจกต์

export const logActivity = (
  user: string,
  action: string,
  target: string,
  extra?: any
) => {
  const logRef = ref(db, 'logs');
  const logEntry = {
    user,
    action,
    target,
    extra: extra || null,
    timestamp: Date.now(),
  };
  push(logRef, logEntry);
};
