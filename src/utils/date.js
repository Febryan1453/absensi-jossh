/**
 * Date and Time utilities for attendance calculation and schedule evaluations.
 */

/**
 * Get current date string in YYYY-MM-DD format (local or UTC)
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
const getCurrentDate = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current time string in HH:MM:SS format
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
const getCurrentTime = (d = new Date()) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Get current datetime in YYYY-MM-DD HH:MM:SS format
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
const getCurrentDateTime = (d = new Date()) => {
  return `${getCurrentDate(d)} ${getCurrentTime(d)}`;
};

/**
 * Convert HH:MM:SS or HH:MM to total seconds from midnight
 * @param {string} timeStr
 * @returns {number}
 */
const timeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10) || 0);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Compare two time strings (HH:MM:SS or HH:MM)
 * @param {string} t1
 * @param {string} t2
 * @returns {number} -1 if t1 < t2, 0 if t1 === t2, 1 if t1 > t2
 */
const compareTimes = (t1, t2) => {
  const s1 = timeToSeconds(t1);
  const s2 = timeToSeconds(t2);
  if (s1 < s2) return -1;
  if (s1 > s2) return 1;
  return 0;
};

/**
 * Check if a time is between start and end (inclusive)
 * @param {string} time
 * @param {string} start
 * @param {string} end
 * @returns {boolean}
 */
const isTimeBetween = (time, start, end) => {
  const t = timeToSeconds(time);
  const s = timeToSeconds(start);
  const e = timeToSeconds(end);
  return t >= s && t <= e;
};

/**
 * Format a Date object to YYYY-MM-DD string
 * @param {Date|string} date
 * @returns {string|null}
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return getCurrentDate(d);
};

module.exports = {
  getCurrentDate,
  getCurrentTime,
  getCurrentDateTime,
  timeToSeconds,
  compareTimes,
  isTimeBetween,
  formatDate
};
