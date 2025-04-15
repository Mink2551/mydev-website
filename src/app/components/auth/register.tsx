'use client';
import React, { useState } from 'react';
import { auth } from './../../firebase/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { writeLog } from '../../../../lib/logs';

const AuthComponent: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (): Promise<void> => {
    setError('');
    if (isRegister) {
      if (password !== confirm) {
        setError('Passwords do not match');
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        writeLog('register', email);
        alert('Registered successfully!');
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        writeLog('login', email);
        alert('Logged in!');
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      writeLog('google-login', auth.currentUser?.email ?? 'Unknown');
      alert('Logged in with Google!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#111]">
      <div className='w-[400px] p-6 bg-[#222] rounded-2xl shadow-xl text-gray-300 flex flex-col justify-center items-center'>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold mb-4 text-white"
        >
          {isRegister ? 'Register' : 'Login'}
        </motion.h1>

        {isRegister && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-[40px] mt-3 rounded-lg bg-[#333] text-gray-200 px-3"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[40px] mt-3 rounded-lg bg-[#333] text-gray-200 px-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-[40px] mt-3 rounded-lg bg-[#333] text-gray-200 px-3"
        />

        {isRegister && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full h-[40px] mt-3 rounded-lg bg-[#333] text-gray-200 px-3"
          />
        )}

        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAuth}
          className="w-full h-[40px] mt-5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold transition-all"
        >
          {isRegister ? 'Register' : 'Login'}
        </motion.button>

        <button
          onClick={handleGoogleLogin}
          className="w-full h-[40px] mt-3 flex items-center justify-center gap-2 rounded-lg bg-white text-black font-medium hover:shadow-md"
        >
          <FcGoogle className="text-xl" /> Continue with Google
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsRegister(!isRegister)}
          className="mt-5 text-sm text-blue-300 hover:text-blue-500 transition-all"
        >
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </motion.button>
      </div>
    </div>
  );
};

export default AuthComponent;
