import React, { useEffect, useState } from 'react';
import { notificationService, type InAppAlert } from '../services/notificationService';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const [currentAlert, setCurrentAlert] = useState<InAppAlert | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeInApp((alert) => {
      setCurrentAlert(alert);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentAlert) return;
    const timer = setTimeout(() => {
      setCurrentAlert(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [currentAlert]);

  if (!currentAlert) return null;

  const getBorderAndBg = () => {
    switch (currentAlert.type) {
      case 'success':
        return 'border-[#0ecb81]/50 bg-[#0ecb81]/10 text-[#0ecb81]';
      case 'danger':
        return 'border-[#f6465d]/50 bg-[#f6465d]/10 text-[#f6465d]';
      case 'warning':
        return 'border-[#f0b90b]/50 bg-[#f0b90b]/10 text-[#f0b90b]';
      case 'alert':
      default:
        return 'border-[#00d2ff]/50 bg-[#00d2ff]/10 text-[#00d2ff]';
    }
  };

  const getIcon = () => {
    switch (currentAlert.type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-[#0ecb81] shrink-0" />;
      case 'danger':
        return <AlertCircle size={16} className="text-[#f6465d] shrink-0" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-[#f0b90b] shrink-0" />;
      case 'alert':
      default:
        return <Bell size={16} className="text-[#00d2ff] shrink-0" />;
    }
  };

  return (
    <div className="fixed top-2 left-3 right-3 z-50 max-w-md mx-auto pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className={`p-3 rounded-xl border shadow-2xl backdrop-blur-md bg-[#121824]/95 flex items-start justify-between space-x-3 ${getBorderAndBg()}`}>
        <div className="flex items-start space-x-2.5">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#eaecef] leading-tight">
              {currentAlert.title}
            </h4>
            <p className="text-[11px] text-[#848e9c] leading-relaxed">
              {currentAlert.message}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentAlert(null)}
          className="text-[#848e9c] hover:text-[#eaecef] p-0.5 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
