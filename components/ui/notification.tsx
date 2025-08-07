"use client";

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Notification({ type, title, description, onClose, action }: NotificationProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styles = {
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-100',
      description: 'text-green-700 dark:text-green-300',
      button: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
      actionButton: 'bg-green-600 hover:bg-green-700 text-white',
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
      description: 'text-red-700 dark:text-red-300',
      button: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200',
      actionButton: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-100',
      description: 'text-yellow-700 dark:text-yellow-300',
      button: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200',
      actionButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
      description: 'text-blue-700 dark:text-blue-300',
      button: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
      actionButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const Icon = icons[type];
  const style = styles[type];

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${style.container}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${style.title}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-sm mt-1 ${style.description}`}>
              {description}
            </p>
          )}
          
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${style.actionButton}`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${style.button}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
