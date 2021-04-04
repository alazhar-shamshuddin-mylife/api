/**
 * This file contains common helper functions related to date/time processing.
 *
 * @author Alazhar Shamshuddin.
 */

/**
 * Gets a string representation of a date in the format YYYY-MM-DD.
 *
 * This function exists for convenience because Mongoose or JavaScript converts
 * MongoDB date fields to date time objects at GMT which are then converted to
 * local time.  In some cases, this time zone conversion results in a date
 * change which we want to prevent.
 *
 * @param {Date} date        A date object.
 * @param {string} format    The desired date formatting.  Only 'YYYY-MM-DD is
 *                           supported.
 * @param {string} timeZone  The target time zone.  Only 'GMT' is supported.
 *                           The date object is assumed to be in GMT.
 *
 * @return {string} The date represented as a string in the specified format
 *                  and in the specified timezone.
 */
function getDateAsString(date, format = 'YYYY-MM-DD', timezone = 'GMT') {
  if (format !== 'YYYY-MM-DD') {
    throw new Error(`Unsupported date format '${format}'.`);
  }

  if (timezone !== 'GMT') {
    throw new Error(`Unsupported timezone '${timezone}'.`);
  }

  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: undefined,
    minute: undefined,
    second: undefined,
    timeZone: timezone,
    timeZoneName: undefined,
  };

  return Intl.DateTimeFormat('en-CA', options).format(date);
}

module.exports = {
  getDateAsString,
};
