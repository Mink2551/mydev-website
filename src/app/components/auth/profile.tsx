"use client"

import React from 'react';
import { auth } from '../../firebase/firebase'; // นำเข้า Firebase auth

const Profile = () => {
  const user = auth.currentUser; // ใช้ currentUser จาก Firebase

  return (
    <div className="w-full h-full flex justify-center items-center p-4 bg-[#222222] text-white">
      {user ? (
        <div className="max-w-lg w-full bg-[#333333] p-6 rounded-lg shadow-lg">
          {/* แสดงข้อมูลผู้ใช้ */}
          <h2 className="text-3xl text-green-400 font-bold mb-4">Profile</h2>
          <div className="mb-4">
            <div className="text-sm text-gray-300">Name:</div>
            <div className="text-lg font-medium">{user.displayName || "No Name"}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-300">Email:</div>
            <div className="text-lg font-medium">{user.email || "No Email"}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-300">UID:</div>
            <div className="text-lg font-medium">{user.uid}</div>
          </div>
        </div>
      ) : (
        <div className="max-w-lg w-full bg-[#333333] p-6 rounded-lg shadow-lg">
          {/* ถ้ายังไม่ login */}
          <h2 className="text-3xl text-red-500 font-bold mb-4">No Data Available</h2>
          <div className="text-sm text-gray-300">Please log in to see your profile.</div>
        </div>
      )}
    </div>
  );
};

export default Profile;
