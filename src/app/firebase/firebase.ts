// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDCedF5AQrt-A7dJnoPUWTEXzVH145_P6M",
  authDomain: "mydev-e19b3.firebaseapp.com",
  databaseURL: "https://mydev-e19b3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mydev-e19b3",
  storageBucket: "mydev-e19b3.firebasestorage.app",
  messagingSenderId: "825001995189",
  appId: "1:825001995189:web:36e2353b9778653b1ec7fc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
