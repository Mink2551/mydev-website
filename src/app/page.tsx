"use client"

import Navbar from "./components/navigations/navbar";
import React, { useState } from "react";
import Sidebar from "./components/navigations/sidebar";

export default function Home() {
  const [pageState , setPageState] = useState<string>("overview");

  return (
    <main className="min-h-[200vh]">
      <Navbar/>
      <Sidebar pageState={pageState} setPageState={setPageState}/>
    </main>
  );
}
