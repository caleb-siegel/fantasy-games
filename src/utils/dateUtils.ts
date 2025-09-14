/**
 * Utility functions for formatting dates and times
 */

export interface FormattedDateTime {
  dayOfWeek: string;
  date: string;
  time: string;
  fullDateTime: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
}

/**
 * Format a date string to show day of week, date, and time
 * @param dateString - ISO date string
 * @returns Formatted date/time information
 */
export function formatGameDateTime(dateString: string): FormattedDateTime {
  const gameDate = new Date(dateString);
  const now = new Date();
  
  // Reset time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const gameDay = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
  
  const dayOfWeek = gameDate.toLocaleDateString('en-US', { weekday: 'short' });
  const date = gameDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  const time = gameDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const fullDateTime = gameDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return {
    dayOfWeek,
    date,
    time,
    fullDateTime,
    isToday: gameDay.getTime() === today.getTime(),
    isTomorrow: gameDay.getTime() === tomorrow.getTime(),
    isPast: gameDate < now
  };
}

/**
 * Get a compact display string for game date/time
 * @param dateString - ISO date string
 * @returns Compact formatted string
 */
export function getCompactGameDateTime(dateString: string): string {
  const formatted = formatGameDateTime(dateString);
  
  if (formatted.isToday) {
    return `Today ${formatted.time}`;
  } else if (formatted.isTomorrow) {
    return `Tomorrow ${formatted.time}`;
  } else {
    return `${formatted.dayOfWeek} ${formatted.time}`;
  }
}

/**
 * Get a detailed display string for game date/time
 * @param dateString - ISO date string
 * @returns Detailed formatted string
 */
export function getDetailedGameDateTime(dateString: string): string {
  const formatted = formatGameDateTime(dateString);
  
  if (formatted.isToday) {
    return `Today, ${formatted.date} at ${formatted.time}`;
  } else if (formatted.isTomorrow) {
    return `Tomorrow, ${formatted.date} at ${formatted.time}`;
  } else {
    return `${formatted.dayOfWeek}, ${formatted.date} at ${formatted.time}`;
  }
}
