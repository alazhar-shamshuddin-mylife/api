/**
 * This file provides miscellaneous utility functions to verify testing
 * results in a consistent manner across various unit and integration tests.
 *
 * @author Alazhar Shamshuddin.
 */

/**
 * Checks if the two arrays of bike ride metric objects are the same.
 *
 * @param {BikeRide.metrics} metrics1  A BikeRide.metrics array.
 * @param {BikeRide.metrics} metrics2  Another BikeRide.metrics array.
 *
 * @return {boolean} True if the two arrays are the same; false otherwise.
 */
function areBikeRideMetricsEqual(metrics1, metrics2) {
  if (metrics1.length === metrics2.length) {
    return metrics1.every((metric1, index) => {
      const date1 = new Date(metric1.startDate);
      const date2 = new Date(metrics2[index].startDate);

      return (metric1.dataSource === metrics2[index].dataSource
        && date1.getTime() === date2.getTime()
        && metric1.movingTime === metrics2[index].movingTime
        && metric1.totalTime === metrics2[index].totalTime
        && metric1.distance === metrics2[index].distance
        && metric1.avgSpeed === metrics2[index].avgSpeed
        && metric1.maxSpeed === metrics2[index].maxSpeed
        && metric1.elevationGain === metrics2[index].elevationGain
        && metric1.maxElevation === metrics2[index].maxElevation);
    });
  }

  return false;
}

/**
 * Checks if the two person.notes elements are the same.
 *
 * @param {Person.notes} notes1  A Person.notes object.
 * @param {Person.notes} notes2  Another Person.notes object.
 *
 * @return {boolean} True if the two objects are the same; false otherwise.
 */
function arePersonNotesEqual(notes1, notes2) {
  if (notes1.length === notes2.length) {
    return notes1.every((note1, index) => {
      const date1 = new Date(note1.date);
      const date2 = new Date(notes2[index].date);

      return (note1.note === notes2[index].note
        && date1.getTime() === date2.getTime());
    });
  }

  return false;
}

/**
 * Checks if the specified specified date time objects are roughly the same.
 * Two date time objects are the roughly if date2 differs from date1 by
 * less than the specified threshold (in milliseconds).
 *
 * @param {Date} date1          A date time value.
 * @param {Date} date2          Another date time value.
 * @param {Date} diffThreshold  Optional.  The number of milliseconds the two
 *                              dates can differ by and still be considered the
 *                              same.  Defaults to 100 ms.
 *
 * @return {boolean} True if the two dates differ by less than or equal to the
 *                   threshold amount; false otherwise.
 */
function IsDateEqualish(date1, date2, diffThreshold = 50) {
  const diff = date2 - date1;
  let isEqual = false;

  if (diff <= diffThreshold) {
    isEqual = true;
  }

  return isEqual;
}

/**
 * Returns a string representation of a date in the format YYYY-MM-DD.
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
  areBikeRideMetricsEqual,
  arePersonNotesEqual,
  getDateAsString,
  IsDateEqualish,
};
