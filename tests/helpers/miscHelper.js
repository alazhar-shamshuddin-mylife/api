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
  const diff = date2 - date1;
  let isEqual = false;

  if (diff <= diffThreshold) {
    isEqual = true;
  }

  return isEqual;
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

module.exports = {
  arePersonNotesEqual,
  IsDateEqualish,
};
