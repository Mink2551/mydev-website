import React from 'react'
import Image from 'next/image'

// Import Logo Image
import Logo from '../../../../public/RoundLogo.png'

// Import Icons
import { MdAccountCircle } from "react-icons/md";

function navbar() {
  return (
    <div className='flex flex-row sticky top-0 z-10 justify-between items-center bg-[#222222] border-b-gray-600 border p-2'>
      {/* Logo and Website's Name */}
      <div className='flex items-center'>
        <Image src={Logo} alt='Logo' width={40}></Image>
        <hr className='w-6 border-gray-600 -rotate-60 mx-2'/>
        <h1 className='text-[#169976] font-bold'>MyDev</h1>
      </div>

      {/* Account */}
      <div className='flex flex-row items-center gap-2 mx-2'>
        <MdAccountCircle className='size-7 text-gray-500'/>
        <p className='font-medium text-gray-500'>UnRegistrations</p>
      </div>


    </div>
  )
}

export default navbar
