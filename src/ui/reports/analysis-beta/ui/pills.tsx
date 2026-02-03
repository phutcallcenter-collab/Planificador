'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/ui/reports/analysis-beta/ui/button';

type PillToggleContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const PillToggleContainer = ({
  children,
  className,
}: PillToggleContainerProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-muted p-1 text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
};

type PillButtonProps = {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
};

export const PillButton = ({ onClick, isActive, children }: PillButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'rounded-full h-auto px-3 py-1 text-xs font-semibold',
        'ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/60'
      )}
    >
      {children}
    </Button>
  );
};
