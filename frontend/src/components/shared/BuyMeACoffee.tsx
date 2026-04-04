import { Coffee } from 'lucide-react';

interface BuyMeACoffeeProps {
  className?: string;
}

export function BuyMeACoffee({ className = '' }: BuyMeACoffeeProps) {
  return (
    <a
      href="https://www.buymeacoffee.com/yourusername" // Placeholder, user can change
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-2.5 px-4 py-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20 whitespace-nowrap z-50 ${className}`}
    >
      <div className="w-6 h-6 bg-black/10 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
        <Coffee size={14} className="fill-black" />
      </div>
      <span className="text-xs uppercase tracking-wider">Buy me a coffee</span>
    </a>
  );
}
