import { HTMLAttributes, forwardRef } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  onClose?: () => void;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'info', title, children, onClose, ...props }, ref) => {
    const variants = {
      success: {
        bg: 'bg-green-500/10 border-green-500/30',
        icon: CheckCircleIcon,
        iconColor: 'text-green-400',
        titleColor: 'text-green-400',
      },
      warning: {
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-yellow-400',
        titleColor: 'text-yellow-400',
      },
      error: {
        bg: 'bg-red-500/10 border-red-500/30',
        icon: XCircleIcon,
        iconColor: 'text-red-400',
        titleColor: 'text-red-400',
      },
      info: {
        bg: 'bg-blue-500/10 border-blue-500/30',
        icon: InformationCircleIcon,
        iconColor: 'text-blue-400',
        titleColor: 'text-blue-400',
      },
    };

    const config = variants[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={`rounded-lg border p-4 ${config.bg} ${className}`}
        role="alert"
        {...props}
      >
        <div className="flex">
          <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0`} />
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={`text-sm font-medium ${config.titleColor}`}>{title}</h3>
            )}
            <div className={`text-sm text-gray-300 ${title ? 'mt-1' : ''}`}>{children}</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <XCircleIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
export type { AlertProps };
