import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

interface SignalIndicatorProps {
  signal: 'green' | 'yellow' | 'red' | 'grey';
  signalStrength?: number;
  className?: string;
}

export function SignalIndicator({ signal, signalStrength, className }: SignalIndicatorProps) {
  const getSignalColor = () => {
    switch (signal) {
      case 'green':
        return 'text-green-500';
      case 'yellow':
        return 'text-yellow-500';
      case 'red':
        return 'text-red-500';
      case 'grey':
      default:
        return 'text-gray-400';
    }
  };

  const getSignalLabel = () => {
    switch (signal) {
      case 'green':
        return 'Sehr gut';
      case 'yellow':
        return 'Gut';
      case 'red':
        return 'Schwach';
      case 'grey':
      default:
        return 'Offline';
    }
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {signal === 'grey' ? (
        <WifiOff className={cn('h-5 w-5', getSignalColor())} />
      ) : (
        <Wifi className={cn('h-5 w-5', getSignalColor())} />
      )}
      <div>
        <span className={cn('text-sm font-medium', getSignalColor())}>
          {getSignalLabel()}
        </span>
        {signalStrength !== undefined && signal !== 'grey' && (
          <span className="text-xs text-muted-foreground ml-1">
            ({signalStrength} dBm)
          </span>
        )}
      </div>
    </div>
  );
}