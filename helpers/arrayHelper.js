/**
 * This file contains common helper functions related to arrays and lists.
 *
 * @author Alazhar Shamshuddin.
 */

/**
 * Checks if the names (items) in the client list are valid (i.e. match the
 * master list) using a cheap, implementation specific shortcut.
 *
 * In general, the client list contains valid names if those names match the
 * master list exactly.  For required values, the client and master lists
 * cannot be undefined or null (but they can be empty).  For values that are
 * not required, a client list is deemed to contain valid names if those names
 * matches the master list exactly or if both lists are undefined or null.
 *
 * For efficiency reasons, this method does not check the contents of the list.
 * It only checks whether the lists are defined and contain the same number
 * of elements.  We can get away with this (at least for now) because all
 * users of this method generate the master list by querying the database
 * for each item in the client list.  Therefore, the master list can only
 * contain elements that already exist in the client list.  A client list
 * contains invalid entries if the database does not have a record of them
 * (i.e., they are missing from the master list.)  The master list should
 * never have entries that are not in the client list based on how these lists
 * are produced.
 *
 * See getMissingItems() to get those items in the client list that are
 * missing from the master list.
 *
 * @param {Array}   masterList  An array of (MongoDB) documents.
 * @param {Array}   clientList  An array strings that must be in the master
 *                                list for the names to be considered valid.
 * @param {boolean} isRequired  If the names are not required, both lists can
 *                                be null/undefined and the names will still
 *                                be considered valid.
 *
 * @return {boolean} True if the names are valid as described above; false
 *                   otherwise.
 */
function areNamesValid(masterList, clientList, isRequired) {
  // If name values are required, both master and client lists must
  // be defined/non-null and contain the same number of values.
  if (isRequired && masterList && clientList && masterList.length === clientList.length) {
    return true;
  }

  // If name values are not required both lists must be undefined/null or
  // have the same number of values.
  if (!isRequired
    && ((masterList && clientList && masterList.length === clientList.length)
      || (!masterList && !clientList))) {
    return true;
  }

  return false;
}

/**
 * Checks if the specified array contains duplicate values.
 *
 * @param {Array} value  An array of objects.
 *
 * @return {boolean} True if the array contains duplicates; false otherwise.
 */
function containsDuplicates(value) {
  const keyCounts = {};
  const duplicateKeys = [];

  // Create an associate array that stores the array items as keys and the
  // number of times each key is referenced as the value.
  value.forEach((x) => {
    if (typeof x === 'object') {
      const xString = JSON.stringify(x);
      keyCounts[xString] = (keyCounts[xString] || 0) + 1;
    }
    else {
      keyCounts[x] = (keyCounts[x] || 0) + 1;
    }
  });

  // Keep track of the items (keys) that are referenced more than once in a
  // separate array.
  Object.keys(keyCounts).forEach((key) => {
    if (keyCounts[key] > 1) {
      duplicateKeys.push(key);
    }
  });

  // Check for duplicate keys.
  if (duplicateKeys.length > 0) {
    return true;
  }

  return false;
}

/**
 * Gets those items in the client list that are missing from the master list.
 * These are the items that cause areNamesValid(masterList, clientList) to
 * return false.
 *
 * @param {Array}   masterList  An array of (MongoDB) documents.  Each
 *                                document object must contain a property
 *                                called name.
 * @param {Array}   clientList  An array strings that must be in the master
 *                                list for the names to be considered valid.
 *
 * @return {Array} An array of items that are in the client list but not in the
 *                 master list or an empty array.
 */
function getMissingItems(masterList, clientList) {
  if (!masterList || masterList.length === 0) {
    // All client supplied names are missing from the master list.

    if (!clientList) {
      return [];
    }

    return clientList;
  }

  const missingItems = [];
  const masterListArray = [];

  // The master list is an array of objects while the client list is an
  // array of names.  Collect all the names in an array from the master list
  // for ease of comparison.
  masterList.forEach((object) => {
    masterListArray.push(object.name);
  });

  // Find all client names that are missing from the master list.
  clientList.forEach((name) => {
    if (!masterListArray.includes(name)) {
      missingItems.push(name);
    }
  });

  return missingItems;
}

module.exports = {
  areNamesValid,
  containsDuplicates,
  getMissingItems,
};
