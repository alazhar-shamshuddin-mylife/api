/**
 * This file provides miscellaneous utility functions to verify testing 
 * results in a consistent manner across various unit and integration tests.
 *
 * @author Alazhar Shamshuddin.
 */

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
  const diffms = date2 - date1;
  let isEqual = false;

  if (diffms <= diffThreshold) {
    isEqual = true;
  }

  return isEqual;
}

function areNotesEqual(notes1, notes2) {
  let areEqual = true;

  notes1.forEach((note, index) => {
    if (note.note !== notes2[index].note
      || new Date(note.date) !== new Date(notes2[index].date)) {
        return false;
      }
  });

  return areEqual;
}

module.exports = {
  areNotesEqual,
  IsDateEqualish,
};
