'use client';

import { useId, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { RiMoonLine, RiSunLine } from '@remixicon/react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function DarkToggle() {
  const id = useId();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div>
      <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
        <Switch
          id={id}
          checked={isDark}
          onCheckedChange={handleToggle}
          className="peer data-[state=checked]:bg-input/50 data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full [&_span]:data-[state=checked]:rtl:-translate-x-full"
        />
        <span className="peer-data-[state=checked]:text-neutral-500 text-neutral-500 pointer-events-none relative ms-0.5 flex min-w-8 items-center justify-center text-center">
          <RiSunLine size={16} aria-hidden="true" />
        </span>
        <span className="peer-data-[state=unchecked]:text-muted-foreground/70 text-neutral-500 pointer-events-none relative me-0.5 flex min-w-8 items-center justify-center text-center">
          <RiMoonLine size={16} aria-hidden="true" />
        </span>
      </div>
      <Label htmlFor={id} className="sr-only">
        Labeled switch
      </Label>
    </div>
  );
}
