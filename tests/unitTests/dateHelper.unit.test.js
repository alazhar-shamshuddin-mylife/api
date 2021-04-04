/**
 * This file contains unit tests for dateHelper.js.
 *
 * @author Alazhar Shamshuddin.
 */

const dateHelper = require('../../helpers/dateHelper');

describe('getDateAsString()', () => {
  test('Convert a valid date/time in GMT.', () => {
    const date1 = new Date('2021-12-31T17:00Z');
    expect(dateHelper.getDateAsString(date1)).toBe('2021-12-31');
  });

  test('Convert a valid date/time not in GMT.', () => {
    const date1 = new Date('2021-12-31T17:00-07:00');
    expect(dateHelper.getDateAsString(date1)).toBe('2022-01-01');
  });

  test('Convert a valid date/time with an unsupported format parameter.', () => {
    const date1 = new Date('2021-12-31T17:00Z');
    const format = 'Bad Format';
    const timezone = 'GMT';

    function getDateAsStringWithBadParams() {
      dateHelper.getDateAsString(date1, format, timezone);
    }

    expect(getDateAsStringWithBadParams).toThrowError(new Error(`Unsupported date format '${format}'.`));
  });

  test('Convert a valid date/time with an unsupported timezone parameter.', () => {
    const date1 = new Date('2021-12-31T17:00Z');
    const format = 'YYYY-MM-DD';
    const timezone = 'Bad Timezone';

    function getDateAsStringWithBadParams() {
      dateHelper.getDateAsString(date1, format, timezone);
    }

    expect(getDateAsStringWithBadParams).toThrowError(new Error(`Unsupported timezone '${timezone}'.`));
  });

  test('Convert an invalid date.', () => {
    const date1 = new Date('2021-12-32');

    function getDateAsStringWithBadParams() {
      dateHelper.getDateAsString(date1);
    }

    expect(getDateAsStringWithBadParams).toThrowError(RangeError);
  });

  test('Convert a valid date with an invalid time.', () => {
    const date1 = new Date('2021-12-31T25:30');

    function getDateAsStringWithBadParams() {
      dateHelper.getDateAsString(date1);
    }

    expect(getDateAsStringWithBadParams).toThrowError(RangeError);
  });

  test('Convert a valid date/time in an invalid timezone.', () => {
    const date1 = new Date('2021-12-31T17:30-95:30');

    function getDateAsStringWithBadParams() {
      dateHelper.getDateAsString(date1);
    }

    expect(getDateAsStringWithBadParams).toThrowError(RangeError);
  });
});
