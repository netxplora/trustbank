import { useState, useEffect } from "react";
import { CreditCard, Plus, Copy, Snowflake, Power, DollarSign, Eye, EyeOff, Lock, Unlock, Wifi, Truck } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@trustbank/shared-ui/components/ui/dialog";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Label } from "@trustbank/shared-ui/components/ui/label";
import logo from "@/assets/logo.png";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { provisionCard } from "@trustbank/shared-utils/services/cardIssuingProvider";

interface Card {
  id: string;
  card_type: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  cardholder_name: string;
  card_brand: string;
  status: string;
  is_frozen: boolean;
  spending_limit: number | null;
  online_enabled: boolean;
  international_enabled: boolean;
  is_physical?: boolean;
  request_status?: string;
  delivery_address?: string;
}

const InfiniteMetalCard = ({ card, onViewDetails, showNumber, setShowNumber, isFlipped, setIsFlipped }: { card: Card; onViewDetails: () => void; showNumber: boolean; setShowNumber: (v: boolean) => void; isFlipped: boolean; setIsFlipped: (v: boolean) => void }) => {
  const { identity } = useBrand();
  const isVisa = card.card_brand === "Visa";
  const last4 = (card.card_number || "").slice(-4);

  return (
    <div className="perspective-1000 w-full max-w-[400px] aspect-[1.586/1] cursor-pointer font-sans group mx-auto" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full duration-700 preserve-3d rounded-xl ${isFlipped ? 'rotate-y-180' : ''}`} style={{ boxShadow: '0 25px 50px -12px rgba(180,140,50,0.3), 0 10px 30px -5px rgba(0,0,0,0.6)' }}>

        {/* Front */}
        <div className={`absolute inset-0 backface-hidden rounded-xl overflow-hidden flex flex-col justify-between p-6 pt-5 pb-5 text-white bg-gradient-to-br from-[#1c1c1c] via-[#252018] to-[#0d0b08] border border-yellow-800/30 ${isFlipped ? 'pointer-events-none' : ''}`}>
          
          {/* Brushed metal texture */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)' }}></div>
          
          {/* Gold geometric pattern */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <svg viewBox="0 0 400 252" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
              {/* Decorative gold lines */}
              <line x1="0" y1="0" x2="400" y2="252" stroke="url(#goldGrad)" strokeWidth="0.3" opacity="0.3" />
              <line x1="400" y1="0" x2="0" y2="252" stroke="url(#goldGrad)" strokeWidth="0.3" opacity="0.2" />
              <line x1="200" y1="0" x2="200" y2="252" stroke="url(#goldGrad)" strokeWidth="0.2" opacity="0.15" />
              <line x1="0" y1="126" x2="400" y2="126" stroke="url(#goldGrad)" strokeWidth="0.2" opacity="0.15" />
              {/* Corner accents */}
              <path d="M 0 0 L 60 0 L 0 40 Z" fill="url(#goldGrad)" opacity="0.06" />
              <path d="M 400 252 L 340 252 L 400 212 Z" fill="url(#goldGrad)" opacity="0.06" />
              <path d="M 400 0 L 340 0 L 400 40 Z" fill="url(#goldGrad)" opacity="0.04" />
              <path d="M 0 252 L 60 252 L 0 212 Z" fill="url(#goldGrad)" opacity="0.04" />
              {/* Diamond pattern */}
              <rect x="170" y="96" width="60" height="60" fill="none" stroke="url(#goldGrad)" strokeWidth="0.4" opacity="0.12" transform="rotate(45, 200, 126)" />
              <rect x="180" y="106" width="40" height="40" fill="none" stroke="url(#goldGrad)" strokeWidth="0.3" opacity="0.08" transform="rotate(45, 200, 126)" />
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C7993E" />
                  <stop offset="50%" stopColor="#F8E298" />
                  <stop offset="100%" stopColor="#A67823" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Gold edge line top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent z-10"></div>
          {/* Gold edge line bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent z-10"></div>
          
          {/* Holographic shimmer on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-200/10 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 z-[5] pointer-events-none"></div>

          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b08] via-transparent to-[#1c1c1c]/60 z-[1]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b08]/60 via-transparent to-[#0d0b08]/40 z-[1]"></div>

          {card.is_frozen && (
            <div className="absolute top-4 right-4 z-30">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 backdrop-blur-sm shadow-sm">Frozen</span>
            </div>
          )}

          {/* Top Row */}
          <div className="relative z-10 flex justify-between items-start pt-1">
            <div className="flex items-center gap-2 drop-shadow-md">
              <img src={logo} alt="Logo" className="h-6 w-6 opacity-90 invert brightness-0" />
              <span className="text-xs font-sans font-semibold tracking-widest uppercase leading-relaxed mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-[#E2C372] to-[#F8E298]">{identity?.platform_name || "TrustBank"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-sans font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#C7993E] to-[#F8E298] leading-none">INFINITE METAL</span>
              <span className="text-[7px] font-sans font-light tracking-widest uppercase opacity-60 mt-0.5">DEBIT CARD</span>
            </div>
          </div>

          {/* Chip & Contactless */}
          <div className="relative z-10 flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-r-[7px] border-r-yellow-500/80 border-b-[5px] border-b-transparent mr-1 drop-shadow-md" />
              <div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#E2C372] via-[#F8E298] to-[#C7993E] flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.6)] overflow-hidden border border-[#A67823]">
                <div className="w-[85%] h-[80%] border border-[#8a681c]/50 rounded-sm flex flex-col justify-between">
                  <div className="flex justify-between h-[30%] border-b border-[#8a681c]/50">
                    <div className="w-[30%] border-r border-[#8a681c]/50" />
                    <div className="w-[40%] border-r border-[#8a681c]/50" />
                    <div className="w-[30%]" />
                  </div>
                  <div className="flex justify-center items-center h-[40%]">
                    <div className="w-4 h-full border-l border-r border-[#8a681c]/50 rounded-full" />
                  </div>
                  <div className="flex justify-between h-[30%] border-t border-[#8a681c]/50">
                    <div className="w-[30%] border-r border-[#8a681c]/50" />
                    <div className="w-[40%] border-r border-[#8a681c]/50" />
                    <div className="w-[30%]" />
                  </div>
                </div>
              </div>
              <Wifi className="h-7 w-7 opacity-80 rotate-90 drop-shadow-md text-yellow-500/80 stroke-[2.5]" />
            </div>

            <div className="flex items-center justify-between w-full mt-2">
              <p className="text-[22px] sm:text-[25px] font-sans font-medium tracking-[0.2em] sm:tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F8E298] to-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {showNumber ? card.card_number : `•••• •••• •••• ${last4}`}
              </p>
              <button onClick={(e) => { e.stopPropagation(); setShowNumber(!showNumber); }} className="opacity-40 hover:opacity-100 transition-opacity p-2 -mr-2 bg-black/20 rounded-full backdrop-blur-sm border border-yellow-700/20 z-20">
                {showNumber ? <EyeOff className="h-4 w-4 text-yellow-200" /> : <Eye className="h-4 w-4 text-yellow-200" />}
              </button>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="relative z-10 flex flex-col gap-1 mt-auto">
            <div className="flex items-center gap-2 self-center ml-10 mb-1">
              <div className="text-[5px] font-bold uppercase opacity-60 tracking-widest leading-[1.2] text-right text-yellow-200">
                Valid<br/>Thru
              </div>
              <p className="text-lg font-sans font-medium drop-shadow-md text-transparent bg-clip-text bg-gradient-to-r from-white to-[#E2C372]">{card.expiry_date}</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-sm font-sans font-light tracking-widest uppercase drop-shadow-md text-white/80">{card.cardholder_name}</p>
              <div className="text-right flex flex-col items-end">
                {isVisa ? (
                  <>
                    <p className="text-3xl font-bold italic drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-[#E2C372] to-[#F8E298] leading-none">VISA</p>
                    <p className="text-[10px] font-sans font-medium opacity-70 mt-0.5 mr-1 tracking-wider text-yellow-200/80">Infinite</p>
                  </>
                ) : (
                  <div className="flex -space-x-3 drop-shadow-lg">
                    <div className="w-10 h-10 rounded-full bg-[#EB001B] shadow-sm mix-blend-screen" />
                    <div className="w-10 h-10 rounded-full bg-[#F79E1B] shadow-sm mix-blend-screen" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden flex flex-col pt-6 pb-4 text-white bg-gradient-to-br from-[#1c1c1c] via-[#1a1508] to-[#0d0b08] border border-yellow-800/30 ${!isFlipped ? 'pointer-events-none' : ''}`}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent"></div>
          <div className="w-full h-12 bg-gradient-to-b from-[#111] via-[#222] to-[#0a0a0a] mt-4 shadow-inner border-y border-yellow-900/20"></div>
          <div className="px-6 flex-1 flex flex-col justify-center gap-3">
            <div className="flex items-center mt-4 shadow-sm">
              <div className="h-9 flex-1 bg-[repeating-linear-gradient(45deg,#fff,#fff_2px,#f0f0f0_2px,#f0f0f0_4px)] rounded-l-sm flex items-center px-4 overflow-hidden relative border border-white/20">
                <p className="font-[cursive] text-slate-800/60 text-lg absolute top-1/2 -translate-y-1/2 select-none -rotate-2">{card.cardholder_name.toLowerCase()}</p>
              </div>
              <div className="h-9 w-14 bg-white rounded-r-sm flex items-center justify-center text-slate-900 font-mono text-sm font-bold border border-white/20 border-l-slate-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none"></div>
                <span className="relative z-10 italic">{showNumber ? card.cvv : '•••'}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 opacity-50 mt-1">
              <img src={logo} alt="Logo" className="h-4 w-4 invert brightness-0" />
              <span className="text-[8px] font-sans font-medium tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#C7993E] to-[#F8E298]">{identity?.platform_name || "TrustBank"}</span>
            </div>
            <p className="text-[7.5px] text-white/40 text-center uppercase max-w-[90%] mx-auto leading-tight font-semibold tracking-widest">
              This card is property of {identity?.platform_name || "TrustBank"}. Unauthorized use is subject to penalty. If found, please return to the nearest branch.
            </p>
          </div>
          <div className="px-6 flex justify-between items-center opacity-70 mt-auto border-t border-yellow-800/20 pt-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500/40"></span>
              <p className="text-[9px] font-mono tracking-widest uppercase text-yellow-200/70">INFINITE METAL</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 bg-transparent border-yellow-700/30 hover:bg-yellow-900/20 hover:text-yellow-200 uppercase tracking-widest font-bold rounded-full text-yellow-200/80 relative z-50 pointer-events-auto" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onViewDetails(); }}>
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ATMCard = ({ card, onViewDetails }: { card: Card; onViewDetails: () => void }) => {
  const { identity } = useBrand();
  const [showNumber, setShowNumber] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const isVisa = card.card_brand === "Visa";
  const last4 = (card.card_number || "").slice(-4);

  // Render luxurious Infinite Metal design
  if (card.card_type === 'infinite') {
    return <InfiniteMetalCard card={card} onViewDetails={onViewDetails} showNumber={showNumber} setShowNumber={setShowNumber} isFlipped={isFlipped} setIsFlipped={setIsFlipped} />;
  }

  return (
    <div className="perspective-1000 w-full max-w-[400px] aspect-[1.586/1] cursor-pointer font-sans group mx-auto" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full duration-700 preserve-3d shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] rounded-xl ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front of Card */}
        <div className={`absolute inset-0 backface-hidden rounded-xl overflow-hidden flex flex-col justify-between p-6 pt-5 pb-5 text-white ${
          card.is_physical ? 'bg-[#111] border-neutral-700/50' : 'bg-[#01142a] border-blue-900/40'
        } ${isFlipped ? 'pointer-events-none' : ''}`}>
          {/* Earth/Network Abstract SVG Background */}
          <div className="absolute inset-0 z-0 overflow-hidden opacity-80 pointer-events-none">
            <div className="absolute right-[-30%] top-[-20%] w-[90%] h-[140%] opacity-40">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full mix-blend-screen ${
                card.is_physical ? 'text-neutral-400' : 'text-cyan-400'
              }`}>
                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-50" />
                <path d="M 10 100 Q 100 0 190 100 Q 100 200 10 100" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-60" />
                <path d="M 10 100 Q 100 50 190 100 Q 100 150 10 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 100 10 Q 0 100 100 190 Q 200 100 100 10" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-60" />
                <path d="M 100 10 Q 50 100 100 190 Q 150 100 100 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="1.5" fill="currentColor" className="opacity-70"/>
                <circle cx="150" cy="150" r="1" fill="currentColor" className="opacity-70"/>
                <circle cx="150" cy="50" r="1.5" fill="currentColor" className="opacity-50"/>
                <circle cx="50" cy="150" r="1" fill="currentColor" className="opacity-80"/>
              </svg>
            </div>
            {/* Glowing waves */}
            <div className={`absolute left-[-20%] top-[40%] -translate-y-1/2 w-[140%] h-[80px] blur-xl transform -rotate-12 mix-blend-screen ${
              card.is_physical ? 'bg-gradient-to-r from-white/0 via-white/20 to-neutral-500/0' : 'bg-gradient-to-r from-cyan-500/0 via-cyan-400/30 to-blue-500/0'
            }`}></div>
            <div className={`absolute left-[-10%] top-[45%] -translate-y-[40%] w-[120%] h-[40px] blur-md transform -rotate-6 mix-blend-screen ${
              card.is_physical ? 'bg-gradient-to-r from-neutral-600/0 via-white/30 to-neutral-600/0' : 'bg-gradient-to-r from-blue-600/0 via-cyan-300/40 to-blue-600/0'
            }`}></div>
            <div className={`absolute left-[20%] top-[50%] w-[100%] h-[20px] blur-sm transform -rotate-[8deg] mix-blend-screen ${
              card.is_physical ? 'bg-gradient-to-r from-white/0 via-white/30 to-transparent' : 'bg-gradient-to-r from-cyan-300/0 via-cyan-200/50 to-transparent'
            }`}></div>
            {/* Dark vignette */}
            <div className={`absolute inset-0 bg-gradient-to-t via-transparent ${card.is_physical ? 'from-[#111] to-[#111]/80' : 'from-[#01142a] to-[#01142a]/80'}`}></div>
            <div className={`absolute inset-0 bg-gradient-to-r via-transparent ${card.is_physical ? 'from-[#111] to-[#111]/40' : 'from-[#01142a] to-[#01142a]/40'}`}></div>
          </div>
          
          {card.is_frozen && (
            <div className="absolute top-4 right-4 z-30">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm shadow-sm">Frozen</span>
            </div>
          )}

          {/* Top Row: Logo & Card Type */}
          <div className="relative z-10 flex justify-between items-start pt-1">
            <div className="flex items-center gap-2 drop-shadow-md">
              <img src={logo} alt="Logo" className="h-6 w-6 opacity-90 invert brightness-0" />
              <span className="text-xs font-sans font-medium tracking-widest opacity-90 uppercase leading-relaxed mt-0.5">{identity?.platform_name || "TrustBank"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-sans font-light tracking-widest uppercase opacity-90 leading-none">DEBIT CARD</span>
              {card.card_type === 'premium' && <span className="text-[8px] font-sans font-bold text-blue-300 tracking-widest uppercase mt-1 drop-shadow-sm">Premium Physical</span>}
            </div>
          </div>

          {/* Middle Row: Chip, Contactless & Number */}
          <div className="relative z-10 flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-r-[7px] border-r-white border-b-[5px] border-b-transparent mr-1 opacity-90 drop-shadow-md" />
              <div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#E2C372] via-[#F8E298] to-[#C7993E] flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.6)] overflow-hidden border border-[#A67823]">
                <div className="w-[85%] h-[80%] border border-[#8a681c]/50 rounded-sm flex flex-col justify-between">
                  <div className="flex justify-between h-[30%] border-b border-[#8a681c]/50">
                    <div className="w-[30%] border-r border-[#8a681c]/50" />
                    <div className="w-[40%] border-r border-[#8a681c]/50" />
                    <div className="w-[30%]" />
                  </div>
                  <div className="flex justify-center items-center h-[40%]">
                    <div className="w-4 h-full border-l border-r border-[#8a681c]/50 rounded-full" />
                  </div>
                  <div className="flex justify-between h-[30%] border-t border-[#8a681c]/50">
                    <div className="w-[30%] border-r border-[#8a681c]/50" />
                    <div className="w-[40%] border-r border-[#8a681c]/50" />
                    <div className="w-[30%]" />
                  </div>
                </div>
              </div>
              <Wifi className="h-7 w-7 opacity-95 rotate-90 drop-shadow-md text-white stroke-[2.5]" />
            </div>
            <div className="flex items-center justify-between w-full mt-2">
              <p className="text-[22px] sm:text-[25px] font-sans font-medium tracking-[0.2em] sm:tracking-[0.25em] text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {showNumber ? card.card_number : `•••• •••• •••• ${last4}`}
              </p>
              <button onClick={(e) => { e.stopPropagation(); setShowNumber(!showNumber); }} className="opacity-40 hover:opacity-100 transition-opacity p-2 -mr-2 bg-black/20 rounded-full backdrop-blur-sm border border-white/5 z-20">
                {showNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="relative z-10 flex flex-col gap-1 mt-auto">
            <div className="flex items-center gap-2 self-center ml-10 mb-1">
              <div className="text-[5px] font-bold uppercase opacity-80 tracking-widest leading-[1.2] text-right">Valid<br/>Thru</div>
              <p className="text-lg font-sans font-medium drop-shadow-md text-white">{card.expiry_date}</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-sm font-sans font-light tracking-widest uppercase drop-shadow-md text-white/90">{card.cardholder_name}</p>
              <div className="text-right flex flex-col items-end">
                {isVisa ? (
                  <>
                    <p className="text-3xl font-bold italic drop-shadow-lg text-white leading-none" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.5)' }}>VISA</p>
                    <p className="text-[11px] font-sans font-light opacity-90 mt-0.5 mr-1 tracking-wide">Classic</p>
                  </>
                ) : (
                  <div className="flex -space-x-3 drop-shadow-lg">
                    <div className="w-10 h-10 rounded-full bg-[#EB001B] shadow-sm mix-blend-screen" />
                    <div className="w-10 h-10 rounded-full bg-[#F79E1B] shadow-sm mix-blend-screen" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden flex flex-col pt-6 pb-4 text-white ${
          isVisa ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50" : "bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50"
        } ${!isFlipped ? 'pointer-events-none' : ''}`}>
          <div className="w-full h-12 bg-gradient-to-b from-[#111] via-[#222] to-[#0a0a0a] mt-4 shadow-inner border-y border-black/50"></div>
          <div className="px-6 flex-1 flex flex-col justify-center gap-3">
            <div className="flex items-center mt-4 shadow-sm">
              <div className="h-9 flex-1 bg-[repeating-linear-gradient(45deg,#fff,#fff_2px,#f0f0f0_2px,#f0f0f0_4px)] rounded-l-sm flex items-center px-4 overflow-hidden relative border border-white/20">
                <p className="font-[cursive] text-slate-800/60 text-lg absolute top-1/2 -translate-y-1/2 select-none -rotate-2">{card.cardholder_name.toLowerCase()}</p>
              </div>
              <div className="h-9 w-14 bg-white rounded-r-sm flex items-center justify-center text-slate-900 font-mono text-sm font-bold border border-white/20 border-l-slate-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none"></div>
                <span className="relative z-10 italic">{showNumber ? card.cvv : '•••'}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 opacity-40 mt-1">
              <img src={logo} alt="Logo" className="h-4 w-4 invert brightness-0" />
              <span className="text-[8px] font-sans font-medium tracking-widest uppercase">{identity?.platform_name || "TrustBank"}</span>
            </div>
            <p className="text-[7.5px] text-white/50 text-center uppercase max-w-[90%] mx-auto leading-tight font-semibold tracking-widest">
              This card is property of {identity?.platform_name || "TrustBank"}. If found, please return to the nearest branch or call 1-800-TRUST-BANK. Use of this card is subject to the cardholder agreement.
            </p>
          </div>
          <div className="px-6 flex justify-between items-center opacity-70 mt-auto border-t border-white/10 pt-3">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-white/30"></span>
               <p className="text-[9px] font-mono tracking-widest uppercase">
                 {card.is_physical ? "PREMIUM PHYSICAL" : "VIRTUAL CARD"}
               </p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 bg-transparent border-white/20 hover:bg-white/10 hover:text-white uppercase tracking-widest font-bold rounded-full relative z-50 pointer-events-auto" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onViewDetails(); }}>
              Details
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

const CardsPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [showRequest, setShowRequest] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("virtual");
  const [baseFee, setBaseFee] = useState<number>(15);

  useEffect(() => {
    if (!user) return;
    fetchCards();
    fetchFee();
    const channel = supabase.channel("cards-rt").on("postgres_changes", { event: "*", schema: "public", table: "cards", filter: `user_id=eq.${user.id}` }, () => fetchCards()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchFee = async () => {
    const { data } = await supabase.from("cms_site_settings").select("value").eq("key", "physical_card_fee").single();
    if (data && data.value) setBaseFee(parseFloat(data.value));
  };

  const fetchCards = async () => {
    if (!user) return;
    const { data } = await supabase.from("cards").select("*").eq("user_id", user.id);
    setCards((data as Card[]) || []);
    setLoading(false);
  };

  const toggleFreeze = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    await supabase.from("cards").update({ is_frozen: !card.is_frozen }).eq("id", id);
    toast({ title: card.is_frozen ? "Card Security Restored" : "Card Frozen Successfully" });
    fetchCards();
  };

  const toggleActivation = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const newStatus = card.status === "inactive" ? "active" : "inactive";
    await supabase.from("cards").update({ status: newStatus }).eq("id", id);
    toast({ title: newStatus === "active" ? "Card Activated" : "Card Deactivated" });
    fetchCards();
  };

  const updateLimit = async () => {
    if (!selectedCard || !newLimit) return;
    const val = parseInt(newLimit.replace(/,/g, ""));
    if (isNaN(val) || val < 100) { toast({ title: "Invalid Limit Authorization", variant: "destructive" }); return; }
    await supabase.from("cards").update({ spending_limit: val }).eq("id", selectedCard.id);
    toast({ title: "Limit Authorization Updated", description: `New limit: $${val.toLocaleString()}` });
    setShowLimits(false);
    setNewLimit("");
    fetchCards();
  };

  const toggleSetting = async (id: string, setting: "online_enabled" | "international_enabled") => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const updateData = setting === "online_enabled" 
      ? { online_enabled: !card.online_enabled } 
      : { international_enabled: !card.international_enabled };
    await supabase.from("cards").update(updateData).eq("id", id);
    toast({ title: "Security Policy Updated" });
    fetchCards();
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) {
      toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Card Deleted", description: "Your card has been permanently removed." });
    setShowDetails(false);
    setSelectedCard(null);
    fetchCards();
  };

  const replaceCard = async (id: string) => {
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) {
      toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Card Invalidated", description: "Your old card has been removed. Please provision a replacement." });
    setShowDetails(false);
    setSelectedCard(null);
    fetchCards();
    setShowRequest(true);
  };

  const handleRequestCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const formEl = e.target as HTMLFormElement;
    const type = selectedType;
    const isVirtual = type === "virtual";
    const isInfinite = type === "infinite";
    const currentFee = isVirtual ? 0 : (isInfinite ? baseFee * 5 : baseFee);
    
    const deliveryAddress = isVirtual ? null : (formEl.elements.namedItem("deliveryAddress") as HTMLInputElement)?.value;
    const holderName = profile?.display_name?.toUpperCase() || "CARD HOLDER";

    const virtualCount = cards.filter(c => !c.is_physical).length;
    const physicalCount = cards.filter(c => c.is_physical).length;

    if (isVirtual && virtualCount >= 1) {
      toast({ title: "Limit Exceeded", description: "You can only have 1 active virtual card.", variant: "destructive" });
      return;
    }
    
    if (!isVirtual && physicalCount >= 1) {
      toast({ title: "Limit Exceeded", description: "You can only have 1 active physical card.", variant: "destructive" });
      return;
    }

    if (!isVirtual && !deliveryAddress) {
      toast({ title: "Validation Error", description: "Delivery address is required for physical cards.", variant: "destructive" });
      return;
    }

    // Handle physical card fee deduction
    let primaryAccountId = null;
    let newBalance = 0;
    if (!isVirtual) {
      const { data: accounts } = await supabase.from("accounts").select("id, balance").eq("user_id", user.id).in("account_type", ["checking", "savings"]).order("balance", { ascending: false }).limit(1);
      
      if (!accounts || accounts.length === 0 || accounts[0].balance < currentFee) {
        toast({ title: "Insufficient Funds", description: `You need at least $${currentFee.toFixed(2)} to request this physical card.`, variant: "destructive" });
        return;
      }
      primaryAccountId = accounts[0].id;
      newBalance = accounts[0].balance - currentFee;
    }

    // 1. Simulate call to Card Issuing API
    const provisionResult = await provisionCard({
      userId: user.id,
      cardType: isVirtual ? "virtual" : "debit",
      cardholderName: holderName
    });

    if (!provisionResult.success) {
      toast({ title: "Authorization Failed", description: provisionResult.message, variant: "destructive" });
      return;
    }

    // 2. Deduct fee if physical
    if (!isVirtual && primaryAccountId) {
      const { error: rpcError } = await (supabase.rpc as any)("process_card_fee", {
        p_user_id: user.id,
        p_account_id: primaryAccountId,
        p_fee_amount: currentFee,
        p_reference: `FEE-${Date.now()}`
      });
      if (rpcError) {
        toast({ title: "Transaction Failed", description: rpcError.message, variant: "destructive" });
        return;
      }
    }

    // 3. Save provisioned details to our DB
    const { error } = await supabase.from("cards").insert({
      user_id: user.id,
      card_type: type,
      card_number: provisionResult.cardNumber,
      expiry_date: provisionResult.expiryDate,
      cvv: provisionResult.cvv,
      cardholder_name: holderName,
      card_brand: provisionResult.cardBrand,
      status: isVirtual ? provisionResult.status : "inactive",
      is_frozen: false,
      is_physical: !isVirtual,
      delivery_address: deliveryAddress,
      request_status: isVirtual ? null : "pending"
    });

    if (error) { toast({ title: "Database Error", description: error.message, variant: "destructive" }); return; }
    
    // Log audit trail for new card
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "card_provisioned",
      entity_type: "cards",
      details: { provider_ref: provisionResult.providerCardId, type: isVirtual ? "virtual" : "debit", is_physical: !isVirtual }
    });

    toast({ title: isVirtual ? "Provisioning Complete" : "Card Requested", description: isVirtual ? provisionResult.message : "Your physical card request has been submitted and is pending approval." });
    setShowRequest(false);
    fetchCards();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const kycTier = profile?.kyc_tier || 0;
  if (kycTier < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Card Management</h1>
          <p className="text-sm text-muted-foreground">Provision and secure your debit and virtual cards</p>
        </div>
        <div className="bg-card rounded-xl border p-8 text-center shadow-sm font-sans max-w-2xl mx-auto mt-10">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold font-poppins mb-2">Feature Locked</h2>
          <p className="text-muted-foreground mb-6">You need to complete KYC Tier 2 (Standard Verification) to provision physical and virtual cards. Please submit your identity documents to unlock this feature.</p>
          <Button onClick={() => window.location.href = "/dashboard/kyc"}>Upgrade KYC Tier</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between font-sans">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Card Management</h1>
          <p className="text-sm text-muted-foreground">Provision and secure your debit and virtual cards</p>
        </div>
        <Button size="sm" onClick={() => setShowRequest(!showRequest)} className="font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Provision Card
        </Button>
      </div>

      {showRequest && (
        <FadeIn>
        <div className="bg-card rounded-xl border p-6 max-w-lg shadow-sm font-sans">
          <h2 className="font-bold font-poppins text-foreground mb-4">Provision New Card</h2>
          <form onSubmit={handleRequestCard} className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Card Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 font-sans">
                <button type="button" onClick={() => setSelectedType("virtual")} className={`flex flex-col items-start p-3 border rounded-xl transition-all ${selectedType === "virtual" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "border-border hover:bg-muted/50"}`}>
                  <CreditCard className={`h-5 w-5 mb-2 ${selectedType === "virtual" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-bold text-sm text-foreground">Virtual Card</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Instant Activation<br/>Fee: $0.00</span>
                </button>
                <button type="button" onClick={() => setSelectedType("premium")} className={`flex flex-col items-start p-3 border rounded-xl transition-all ${selectedType === "premium" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "border-border hover:bg-muted/50"}`}>
                  <CreditCard className={`h-5 w-5 mb-2 ${selectedType === "premium" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-bold text-sm text-foreground">Premium Physical</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">3-5 Business Days<br/>Fee: ${baseFee.toFixed(2)}</span>
                </button>
                <button type="button" onClick={() => setSelectedType("infinite")} className={`flex flex-col items-start p-3 border rounded-xl transition-all ${selectedType === "infinite" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "border-border hover:bg-muted/50"}`}>
                  <CreditCard className={`h-5 w-5 mb-2 ${selectedType === "infinite" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-bold text-sm text-foreground">Infinite Metal</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">1-2 Business Days<br/>Fee: ${(baseFee * 5).toFixed(2)}</span>
                </button>
              </div>
            </div>
            
            {selectedType !== "virtual" && (
              <SlideUp>
                <div className="space-y-4 border-t pt-4 mt-2">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Address</Label>
                    <Input name="deliveryAddress" placeholder="123 Main St, City, Country" className="mt-1.5" required />
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-lg text-sm flex items-start gap-3">
                    <DollarSign className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>
                      <strong>Provisioning Fee:</strong> A fee of <strong>${(selectedType === "infinite" ? baseFee * 5 : baseFee).toFixed(2)}</strong> will be deducted from your primary account balance upon approval.
                    </p>
                  </div>
                </div>
              </SlideUp>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 font-bold">Authorize Provisioning</Button>
              <Button type="button" variant="outline" onClick={() => setShowRequest(false)} className="font-bold">Cancel</Button>
            </div>
          </form>
        </div>
        </FadeIn>
      )}

      {cards.some(c => c.is_physical && c.request_status === 'pending') && (
        <FadeIn>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg font-sans">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-2.5 rounded-full">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Physical Card Request Processing</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Your physical card request has been successfully received and is currently being processed. 
                  You will be notified with tracking details once your card has been dispatched for secure delivery.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {cards.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center shadow-sm font-sans">
          <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No active cards found. Provision a new card to begin.</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          {cards.map((card) => (
            <StaggerItem key={card.id} className="space-y-0">
              <ATMCard card={card} onViewDetails={() => { setSelectedCard(card); setShowDetails(true); }} />
              <div className="bg-card border border-t-0 rounded-b-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 shadow-sm">
                <Button variant="outline" size="sm" className="text-xs font-bold h-9" onClick={() => { navigator.clipboard.writeText(card.card_number); toast({ title: "Copied to Clipboard!" }); }}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="text-xs font-bold h-9" onClick={() => toggleFreeze(card.id)}>
                  {card.is_frozen ? <Unlock className="h-3.5 w-3.5 mr-1.5" /> : <Snowflake className="h-3.5 w-3.5 mr-1.5" />}
                  {card.is_frozen ? "Unfreeze" : "Freeze"}
                </Button>
                <Button variant="outline" size="sm" className="text-xs font-bold h-9" onClick={() => toggleActivation(card.id)}>
                  <Power className="h-3.5 w-3.5 mr-1.5" />
                  {card.status === "inactive" ? "Activate" : "Deactivate"}
                </Button>
                <Button variant="outline" size="sm" className="text-xs font-bold h-9" onClick={() => { setSelectedCard(card); setShowLimits(true); }}>
                  <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Limits
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold">Card Parameters</DialogTitle>
            <DialogDescription>Review and manage security policies</DialogDescription>
          </DialogHeader>
          {selectedCard && (
            <FadeIn>
            <div className="space-y-5 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 border rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Card Number</p>
                  <p className="font-mono font-bold text-foreground">{(selectedCard.card_number || "").replace(/(.{4})/g, "$1 ").trim()}</p>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">CVV Security</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-foreground">{showCvv ? selectedCard.cvv : "•••"}</p>
                    <button onClick={() => setShowCvv(!showCvv)} className="hover:bg-muted p-1 rounded transition-colors">
                      {showCvv ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Expiration</p>
                  <p className="font-mono font-bold text-foreground">{selectedCard.expiry_date}</p>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${selectedCard.status === "active" ? "text-success" : "text-destructive"}`}>{selectedCard.status}</p>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Spending Limit</p>
                  <p className="font-mono font-bold text-foreground">${(selectedCard.spending_limit || 0).toLocaleString()}</p>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Class</p>
                  <p className="font-bold text-xs uppercase tracking-wider text-foreground">{selectedCard.card_type}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold font-poppins text-foreground">Security Policies</h3>
                {[
                  { key: "online_enabled" as const, label: "Digital / E-Commerce Transactions", value: selectedCard.online_enabled },
                  { key: "international_enabled" as const, label: "International Clearing", value: selectedCard.international_enabled },
                ].map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between p-3.5 bg-muted/10 border rounded-lg">
                    <span className="text-xs font-bold text-foreground">{label}</span>
                    <button onClick={() => { toggleSetting(selectedCard.id, key); setSelectedCard(prev => prev ? { ...prev, [key]: !prev[key] } : null); }}
                      className={`w-11 h-6 rounded-full transition-colors ${value ? "bg-success" : "bg-muted-foreground/30"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${value ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t mt-4 flex gap-2">
                <Button variant="outline" className="flex-1 font-bold text-destructive hover:bg-destructive/10" onClick={() => deleteCard(selectedCard.id)}>Delete Card</Button>
                <Button className="flex-1 font-bold" onClick={() => replaceCard(selectedCard.id)}>Replace Card</Button>
              </div>
            </div>
            </FadeIn>
          )}
        </DialogContent>
      </Dialog>

      {/* Limits Dialog */}
      <Dialog open={showLimits} onOpenChange={setShowLimits}>
        <DialogContent className="max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold">Authorize Limit Change</DialogTitle>
            <DialogDescription>Card ending in {(selectedCard?.card_number || "").slice(-4)}</DialogDescription>
          </DialogHeader>
          {selectedCard && (
            <FadeIn>
            <div className="space-y-5 mt-2">
              <div className="bg-muted/10 border rounded-lg p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Limit</p>
                <p className="text-2xl font-mono font-bold text-foreground">${(selectedCard.spending_limit || 0).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">New Limit Request ($)</Label>
                <Input type="text" placeholder="e.g. 5,000" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} className="font-mono font-bold" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 font-bold" onClick={updateLimit}>Authorize</Button>
                <Button variant="outline" className="font-bold" onClick={() => setShowLimits(false)}>Cancel</Button>
              </div>
            </div>
            </FadeIn>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CardsPage;
