/**
 * Convert a date string (YYYY-MM-DD) to Unix timestamp
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {number} Unix timestamp in seconds
 */
export const dateToTimestamp = (dateString) => {
  const date = new Date(dateString);
  // Set to start of day to avoid timezone issues
  date.setUTCHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

/**
 * Convert Unix timestamp to date string (YYYY-MM-DD)
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const timestampToDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
};

/**
 * Get default date range (30 days ending today)
 * @returns {Object} Object with startDate and endDate strings
 */
export const getDefaultDateRange = () => {
  const end = new Date();
  // Ensure end date is not in the future
  const today = new Date();
  if (end > today) {
    end.setTime(today.getTime());
  }
  
  const start = new Date();
  start.setDate(end.getDate() - 30);
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

/**
 * Calculate the number of days between two dates
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {number} Number of days between the dates
 */
export const daysBetweenDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Determine appropriate granularity based on date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} Granularity ('1h', '1d', '1w')
 */
export const getOptimalGranularity = (startDate, endDate) => {
  // For now, we'll use '1d' for all ranges since that's what the API supports
  // In the future, we can add support for other granularities when available
  return '1d';
};

/**
 * Validate that end date is after start date and not in the future
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  // Check that start < end and end is not in the future
  return start < end && end <= today;
};

/**
 * Validate and clamp timestamps to reasonable bounds
 * @param {number} startTimestamp - Start timestamp in seconds
 * @param {number} endTimestamp - End timestamp in seconds
 * @returns {Object} Object with validated startTimestamp and endTimestamp
 */
export const validateTimestamps = (startTimestamp, endTimestamp) => {
  const now = Math.floor(Date.now() / 1000);
  const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60); // 2 years ago
  
  // Clamp end timestamp to current time
  const validEndTimestamp = Math.min(endTimestamp, now);
  
  // Ensure start timestamp is not too far in the past
  const validStartTimestamp = Math.max(startTimestamp, twoYearsAgo);
  
  // Ensure start is before end
  const finalStartTimestamp = Math.min(validStartTimestamp, validEndTimestamp - (24 * 60 * 60)); // At least 1 day difference
  
  return {
    startTimestamp: finalStartTimestamp,
    endTimestamp: validEndTimestamp
  };
};
