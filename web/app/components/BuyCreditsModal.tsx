"use client";

import { useState, useEffect } from "react";
import { X, Coins } from "lucide-react";
import { useBuyCredits } from "../../lib/mutations";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUANTITIES = [1, 5, 10] as const;
const PRICE_PER_CREDIT_EUR = 2;
const MAX_CUSTOM = 100;

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [selected, setSelected] = useState<number | "custom">(5);
  const [customValue, setCustomValue] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyCredits = useBuyCredits();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setSelected(5);
      setCustomValue("");
      setError(null);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const quantity =
    selected === "custom"
      ? Number.parseInt(customValue, 10) || 0
      : selected;
  const isValid = Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_CUSTOM;
  const totalEur = quantity * PRICE_PER_CREDIT_EUR;

  const handleContinue = () => {
    if (!isValid) {
      setError(`Enter a quantity between 1 and ${MAX_CUSTOM}`);
      return;
    }
    setError(null);
    buyCredits.mutate(
      { quantity },
      {
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Checkout failed");
        },
      },
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="absolute inset-0 bg-rc-text/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className={`relative bg-white border border-rc-border rounded-3xl p-8 w-full max-w-[440px] shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-300 transform ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-rc-hint hover:text-rc-red transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-rc-red/5 rounded-2xl flex items-center justify-center mb-5 border border-rc-red/10">
            <Coins className="w-6 h-6 text-rc-red" />
          </div>
          <h2 className="text-2xl font-bold text-rc-text mb-2">Buy credits</h2>
          <p className="text-rc-hint text-sm">
            One-time credits never expire. €{PRICE_PER_CREDIT_EUR} per analysis,
            used after your monthly cap is reached.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {PRESET_QUANTITIES.map((qty) => (
            <button
              key={qty}
              type="button"
              onClick={() => setSelected(qty)}
              className={`px-4 py-4 rounded-2xl border-2 text-left transition-all ${
                selected === qty
                  ? "border-rc-red bg-rc-red/5"
                  : "border-rc-border hover:border-rc-red/30"
              }`}
            >
              <div className="text-lg font-bold text-rc-text">
                {qty} credit{qty > 1 ? "s" : ""}
              </div>
              <div className="text-rc-hint text-sm">
                €{qty * PRICE_PER_CREDIT_EUR}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelected("custom")}
            className={`px-4 py-4 rounded-2xl border-2 text-left transition-all ${
              selected === "custom"
                ? "border-rc-red bg-rc-red/5"
                : "border-rc-border hover:border-rc-red/30"
            }`}
          >
            <div className="text-lg font-bold text-rc-text">Custom</div>
            <div className="text-rc-hint text-sm">Pick a number</div>
          </button>
        </div>

        {selected === "custom" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-rc-text mb-2">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              max={MAX_CUSTOM}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="e.g. 25"
              className="w-full px-4 py-3 rounded-xl border border-rc-border focus:border-rc-red focus:outline-none text-rc-text"
            />
          </div>
        )}

        <div className="flex items-baseline justify-between mb-6 pt-4 border-t border-rc-border">
          <span className="text-rc-hint">Total</span>
          <span className="text-2xl font-bold text-rc-text">€{totalEur}</span>
        </div>

        {error && (
          <p className="mb-4 text-sm text-rc-red" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!isValid || buyCredits.isPending}
          className="w-full py-3 px-6 rounded-xl bg-rc-red text-white font-semibold hover:bg-rc-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buyCredits.isPending
            ? "Redirecting…"
            : `Continue to checkout • €${totalEur}`}
        </button>

        <p className="mt-3 text-center text-xs text-rc-hint">
          Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}
