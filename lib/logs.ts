// lib/log.ts
import { db } from '../src/app/firebase/firebase'; // อย่าลืม export db จาก firebase.ts
import { ref, push } from 'firebase/database';

export const writeLog = (action: string, user: string | null) => {
  const logRef = ref(db, 'logs');
  push(logRef, {
    action,
    user,
    timestamp: Date.now()
  });
};
