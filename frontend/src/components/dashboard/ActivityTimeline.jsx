import React from 'react';
import { cn } from '../../utils/cn';

export const ActivityTimeline = ({ activities = [] }) => {
  if (!activities.length) {
    return <p className="text-sm text-text-muted p-4">No recent activity.</p>;
  }

  const getColorClass = (type) => {
    switch(type) {
      case 'success': return 'bg-mint';
      case 'warning': return 'bg-coral';
      case 'info':
      default: return 'bg-soft-purple';
    }
  };

  return (
    <div className="space-y-8">
      {activities.map((activity, index) => (
        <div key={activity.id || index} className="flex gap-4">
          <div className="relative flex flex-col items-center">
            <div className={cn("w-3 h-3 rounded-full shadow-sm", getColorClass(activity.type))}></div>
            {index < activities.length - 1 && (
              <div className={cn("w-1 h-full absolute top-3 mt-2 rounded-full opacity-10", getColorClass(activity.type))}></div>
            )}
          </div>
          <div className="pb-2">
            <p className="text-sm font-extrabold text-text-dark">{activity.title}</p>
            <p className="text-xs text-text-muted mt-1">{activity.description}</p>
            <p className="text-[10px] text-soft-purple/60 font-black mt-2 uppercase tracking-widest">{activity.timeAgo}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
