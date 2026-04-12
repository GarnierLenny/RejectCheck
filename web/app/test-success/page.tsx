"use client";

import { useState } from "react";
import { SuccessModal } from "../components/SuccessModal";
import Link from "next/link";

export default function TestSuccessPage() {
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-screen bg-rc-bg flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-[500px]">
        <h1 className="text-4xl font-bold mb-6">Success Celebration Test</h1>
        <p className="text-rc-muted mb-8">
          This page is a temporary route to test the new payment success modal and confetti animation.
        </p>
        
        <button 
          onClick={() => setShowModal(true)}
          className="px-8 py-3 bg-rc-text text-white rounded-xl font-mono text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Relaunch Modal
        </button>
        
        <Link 
          href="/account"
          className="block mt-6 font-mono text-[11px] text-rc-red hover:underline"
        >
          Back to Account Page
        </Link>
      </div>

      {showModal && (
        <SuccessModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
