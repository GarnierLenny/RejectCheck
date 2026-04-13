"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { PartyPopper, Sparkles } from "lucide-react";

interface SuccessModalProps {
  onClose: () => void;
}

export function SuccessModal({ onClose }: SuccessModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'idle' | 'filling' | 'draining' | 'completed'>('idle');
  const [showClaimMessage, setShowClaimMessage] = useState(false);
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Show with slight delay for animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Initial celebration
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, colors: ['#C93A39', '#ffffff'] };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 40 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Animation Loop for Progress logic
  useEffect(() => {
    if (mode === 'idle' || mode === 'completed') {
      lastTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        setProgress(prev => {
          let next = prev;
          if (mode === 'filling') {
            next = prev + (0.04 * deltaTime);
            if (next >= 100) {
              next = 100;
              setMode('completed');
              handleComplete();
            }
          } else if (mode === 'draining') {
            next = prev - (0.15 * deltaTime);
            if (next <= 0) {
              next = 0;
              setMode('idle');
            }
          }
          return next;
        });
      } else {
        lastTimeRef.current = time;
      }
      
      if (mode === 'filling' || mode === 'draining') {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [mode]);

  const handleStartHolding = () => {
    if (mode === 'completed') return;
    setMode('filling');
  };

  const handleStopHolding = () => {
    if (mode === 'completed') return;
    setMode('draining');
  };

  const handleComplete = () => {
    // Big Final Blast
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 10000,
      colors: ['#C93A39', '#ffffff']
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    // Sequence: Show message -> Close
    setTimeout(() => {
      setShowClaimMessage(true);
      
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 800);
      }, 2500);
    }, 800);
  };

  const isHolding = mode === 'filling';
  const isCompleted = mode === 'completed';

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-700 ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {/* Overlay */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ${showClaimMessage ? "bg-black/90 backdrop-blur-xl" : "bg-rc-text/40 backdrop-blur-md"}`} 
      />
      
      {/* Final Message Overlay */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none transition-all duration-1000 ${showClaimMessage ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <p className="text-white font-mono text-[18px] md:text-[24px] tracking-[0.3em] uppercase text-center px-10 leading-relaxed font-medium">
          Then go claim <br className="md:hidden" /> what&apos;s yours.
        </p>
        <p className="mt-8 font-mono text-[12px] md:text-[14px] tracking-[0.5em] uppercase text-rc-red font-bold">
          RejectCheck
        </p>
      </div>

      {/* Modal Card */}
      <div className={`relative bg-white border border-rc-border rounded-[32px] p-8 md:p-14 w-full max-w-[580px] shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-700 transform ${isVisible && !showClaimMessage ? "translate-y-0 scale-100 opacity-100" : "translate-y-12 scale-95 opacity-0 pointer-events-none"}`}>
        <div className="text-center">
          {/* Main Illustration */}
          <div className={`relative w-full max-w-[280px] aspect-[4/3] mx-auto mb-10 overflow-hidden transition-transform duration-700 ${isHolding ? "scale-105" : "scale-100"}`}>
            <Image 
              src="/undraw_home-run_n1g7.svg" 
              alt="Home Run Celebration" 
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/5 border border-rc-red/10 mb-6">
            <PartyPopper className="w-3.5 h-3.5 text-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">Your journey begins</span>
          </div>

          <h2 className="text-[32px] md:text-[40px] font-bold text-rc-text mb-4 leading-[1.1] tracking-tight">
            The ball is now <br />
            <span className="text-rc-red">within reach.</span>
          </h2>

          <p className="text-[17px] text-rc-muted mb-10 mx-auto max-w-[420px] leading-relaxed">
            You&apos;ve taken the first step. Now it&apos;s time to put in the work, surpass yourself, and land your dream job.
          </p>

          <div className="flex flex-col items-center gap-4">
            <button 
              onPointerDown={handleStartHolding}
              onPointerUp={handleStopHolding}
              onPointerLeave={handleStopHolding}
              disabled={isCompleted}
              className={`group relative overflow-hidden flex items-center justify-center w-full py-5 rounded-2xl font-mono text-[12px] tracking-[0.2em] uppercase transition-all duration-300 font-bold cursor-pointer select-none bg-rc-text text-white shadow-xl ${isHolding ? "scale-[0.98] shadow-inner" : "hover:scale-[1.01] active:scale-[0.98]"} ${isCompleted ? "bg-rc-green text-white cursor-default scale-100" : ""}`}
              style={{ touchAction: 'none' }}
            >
              <div 
                className={`absolute left-0 top-0 bottom-0 bg-rc-red`}
                style={{ width: `${progress}%` }}
              />
              
              <span className="relative z-10 flex items-center gap-2">
                {isCompleted ? "COMMITTED" : "I'M COMMITTED"} 
              </span>
            </button>
            <p className={`font-mono text-[10px] tracking-widest text-rc-hint transition-opacity duration-300 ${isHolding ? "opacity-0" : "opacity-100"}`}>
              {isCompleted ? "Redirecting..." : "HOLD TO CONFIRM YOUR COMMITMENT"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
