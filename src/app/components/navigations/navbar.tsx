'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MdAccountCircle } from "react-icons/md";
import { auth } from './../../firebase/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { writeLog } from '../../../../lib/logs';
import Logo from '../../../../public/RoundLogo.png';

function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [logoutTime, setLogoutTime] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      writeLog('logout', currentUser?.email || 'Unknown');
      const now = new Date();
      setLogoutTime(now.toLocaleString());
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <div className='flex flex-row sticky top-0 z-10 justify-between items-center bg-[#222222] border-b-gray-600 border p-2'>
      {/* Logo and Website's Name */}
      <div className='flex items-center'>
        <Image src={Logo} alt='Logo' width={40} />
        <hr className='w-6 border-gray-600 -rotate-60 mx-2'/>
        <h1 className='text-[#169976] font-bold'>MyDev</h1>
      </div>

      {/* Account */}
      <div className='flex flex-col items-end gap-1 mx-2'>
        <div className='flex flex-row items-center gap-2'>
          <MdAccountCircle className='size-7 text-gray-500'/>
          {currentUser ? (
            <>
              <p className='font-medium text-[#169976]'>{currentUser.displayName || currentUser.email}</p> 
              <button 
                onClick={handleLogout} 
                className="ml-4 text-white bg-red-600 hover:bg-red-700 p-2 rounded-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <p className='font-medium text-gray-500'>Unregistered</p>
          )}
        </div>
        {/* Show logout time */}
        {logoutTime && (
          <p className="text-sm text-gray-400 mt-1">
            Logged out at: {logoutTime}
          </p>
        )}
      </div>
    </div>
  );
}

export default Navbar;
