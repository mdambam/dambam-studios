'use client';

import { Building2, Briefcase, Bot } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function PersistentSlider() {
  const router = useRouter();
  const pathname = usePathname();

  const buttons = [
    {
      id: 'institute',
      label: 'Institute',
      icon: <Building2 className="h-6 w-6" />,
      path: '/institute',
      gradient: 'from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600'
    },
    {
      id: 'ai',
      label: 'AI',
      icon: <Bot className="h-6 w-6" />,
      path: '/login',
      gradient: 'from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400'
    },
    {
      id: 'agency',
      label: 'Agency',
      icon: <Briefcase className="h-6 w-6" />,
      path: '/agency',
      gradient: 'from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600'
    }
  ];

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 ml-4">
      <div className="flex flex-col gap-4 p-2 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => router.push(button.path)}
            className={cn(
              'h-16 w-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300',
              `bg-gradient-to-br ${button.gradient}`,
              pathname === button.path ? 'ring-2 ring-white/50 scale-105' : 'opacity-90 hover:opacity-100 hover:scale-105'
            )}
            aria-label={button.label}
          >
            <span className="text-white">{button.icon}</span>
            <span className="text-xs font-medium text-white">{button.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
