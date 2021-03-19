/**
 * This file contains unit tests for arrayHelper.js.
 *
 * @author Alazhar Shamshuddin.
 */

const arrayHelper = require('../../helpers/arrayHelper');

describe('areNamesValid()', () => {
  let masterList;
  let clientList;

  test('Client list contains valid names if it is required and matches the master list.', () => {
    masterList = [];
    clientList = [];
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(true);

    masterList = ['', 0, null, undefined, false];
    clientList = masterList;
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(true);

    masterList = ['a'];
    clientList = masterList;
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(true);

    masterList = ['a', 'b', 'foo', 'bar'];
    clientList = masterList;
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(true);

    masterList = ['a', 'b'];
    clientList = ['c', 'd'];
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(true);

    masterList = [0];
    clientList = [1];
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(true);

    masterList = [];
    clientList = [undefined];
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(false);
  });

  test('Client list does not contain valid names if it is required but one of the lists is not defined.', () => {
    masterList = undefined;
    clientList = undefined;
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(false);

    masterList = undefined;
    clientList = ['a', 'b'];
    expect(arrayHelper.areNamesValid(masterList, clientList, true)).toBe(false);
  });

  test('Client list contains valid names if it is not required but matches the master list.', () => {
    masterList = undefined;
    clientList = masterList;
    expect(arrayHelper.areNamesValid(masterList, clientList, false)).toBe(true);

    masterList = undefined;
    clientList = null;
    expect(arrayHelper.areNamesValid(masterList, clientList, false)).toBe(true);

    masterList = [];
    clientList = [];
    expect(arrayHelper.areNamesValid(masterList, clientList, false)).toBe(true);

    masterList = ['a', 'b'];
    clientList = [false, null];
    expect(arrayHelper.areNamesValid(masterList, clientList, false)).toBe(true);
  });

  test('Client list does not contains valid names if it is not required and does not matches the master list.', () => {
    masterList = ['a', 'b'];
    clientList = [null];
    expect(arrayHelper.areNamesValid(masterList, clientList, false)).toBe(false);
  });
});

describe('containsDuplicates()', () => {
  test('An empty array does not contain duplicates.', () => {
    expect(arrayHelper.containsDuplicates([])).toBe(false);
  });

  test('An array with one item does not contain duplicates.', () => {
    expect(arrayHelper.containsDuplicates([''])).toBe(false);
  });

  test('This array does not contains duplicates: [0, false, undefined, null].', () => {
    expect(arrayHelper.containsDuplicates([0, false, undefined, null])).toBe(false);
  });

  test('This array does not contains duplicates: [1, "foo", "bar", true].', () => {
    expect(arrayHelper.containsDuplicates([1, 'foo', 'bar', true])).toBe(false);
  });

  test('This array does contain duplicates: [undefined, undefined, false].', () => {
    expect(arrayHelper.containsDuplicates([undefined, undefined, false])).toBe(true);
  });

  test('This array does contain duplicates: [1, "foo", 1, "bar", ""].', () => {
    expect(arrayHelper.containsDuplicates([1, 'foo', 1, 'bar', ''])).toBe(true);
  });
});

describe('getMissingItems()', () => {
  let masterList = [];
  let clientList = [];
  let missingItems = [];

  test('No items from the client are missing in the master list.', () => {
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = null;
    clientList = masterList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = undefined;
    clientList = masterList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = undefined;
    clientList = null;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = [{ name: '' }, { name: 0 }, { name: null }, { name: undefined }, { name: false }];
    clientList = ['', 0, null, undefined, false];
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = [{ name: 'a' }];
    clientList = ['a'];
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = [{ name: 'a' }, { name: 'b' }, { name: 'foo' }, { name: 'bar' }];
    clientList = ['a', 'b', 'foo', 'bar'];
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
    clientList = ['a', 'b'];
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);
  });

  test('All items from the client list are missing from the master list.', () => {
    masterList = [{ name: 'a' }, { name: 'b' }];
    clientList = ['c', 'd'];
    missingItems = clientList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = [{ name: 0 }];
    clientList = [1];
    missingItems = clientList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = [];
    clientList = [undefined];
    missingItems = clientList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = undefined;
    clientList = ['a', 'b'];
    missingItems = clientList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = ['a', 'b'];
    clientList = ['a', 'b'];
    missingItems = clientList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);

    masterList = ['a', 'b'];
    clientList = [false, null];
    missingItems = clientList;
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);
  });

  test('Some items from the client are missing from the master list.', () => {
    masterList = [{ name: 'a' }, { name: 'b' }];
    clientList = ['a', 'b', 'c'];
    missingItems = ['c'];
    expect(arrayHelper.getMissingItems(masterList, clientList)).toStrictEqual(missingItems);
  });
});
