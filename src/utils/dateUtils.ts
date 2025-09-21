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
 * Parse a date string ensuring it's treated as UTC
 * @param dateString - ISO date string from backend
 * @returns Date object correctly interpreted as UTC
 */
function parseUTCDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // If it already has timezone info, use it as-is
  if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
    return new Date(dateString);
  }
  
  // If it's a naive datetime (no timezone), treat it as UTC
  return new Date(dateString + 'Z');
}

/**
 * Format a date string to show day of week, date, and time in user's timezone
 * @param dateString - ISO date string
 * @param timezone - User's timezone (e.g., 'America/New_York')
 * @returns Formatted date/time information
 */
export function formatGameDateTime(dateString: string, timezone: string = 'America/New_York'): FormattedDateTime {
  // Ensure the date string is treated as UTC
  const gameDate = parseUTCDate(dateString);
  const now = new Date();
  
  // Reset time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const gameDay = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
  
  const dayOfWeek = gameDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    timeZone: timezone 
  });
  const date = gameDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: timezone 
  });
  const time = gameDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true,
    timeZone: timezone 
  });
  
  const fullDateTime = gameDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
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
 * Get a compact display string for game date/time in user's timezone
 * @param dateString - ISO date string
 * @param timezone - User's timezone (e.g., 'America/New_York')
 * @returns Compact formatted string
 */
export function getCompactGameDateTime(dateString: string, timezone: string = 'America/New_York'): string {
  const formatted = formatGameDateTime(dateString, timezone);
  
  if (formatted.isToday) {
    return `Today ${formatted.time}`;
  } else if (formatted.isTomorrow) {
    return `Tomorrow ${formatted.time}`;
  } else {
    return `${formatted.dayOfWeek} ${formatted.time}`;
  }
}

/**
 * Get a detailed display string for game date/time in user's timezone
 * @param dateString - ISO date string
 * @param timezone - User's timezone (e.g., 'America/New_York')
 * @returns Detailed formatted string
 */
export function getDetailedGameDateTime(dateString: string, timezone: string = 'America/New_York'): string {
  const formatted = formatGameDateTime(dateString, timezone);
  
  if (formatted.isToday) {
    return `Today, ${formatted.date} at ${formatted.time}`;
  } else if (formatted.isTomorrow) {
    return `Tomorrow, ${formatted.date} at ${formatted.time}`;
  } else {
    return `${formatted.dayOfWeek}, ${formatted.date} at ${formatted.time}`;
  }
}

/**
 * Check if a game has started by comparing UTC times correctly
 * @param gameStartTime - ISO date string from backend (stored as UTC)
 * @returns true if the game has started
 */
export function isGameStarted(gameStartTime: string): boolean {
  if (!gameStartTime) return false;
  
  // Ensure the date string is treated as UTC
  const gameDate = parseUTCDate(gameStartTime);
  const now = new Date();
  
  return now >= gameDate;
}

/**
 * Check if a game is locked (has started) with proper timezone handling
 * @param gameStartTime - ISO date string from backend (stored as UTC)
 * @returns true if the game is locked
 */
export function isGameLocked(gameStartTime: string): boolean {
  return isGameStarted(gameStartTime);
}
