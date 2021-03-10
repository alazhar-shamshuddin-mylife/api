/**
 * @todo: Complete me.
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
 * Checks if the specified array (or strings) contains duplicate values.
 *
 * @param {Array} value  An array of strings.
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
 * @todo: Complete me.
 */
function getMissingItems(masterList, clientList) {
  if (masterList === null || masterList.length === 0) {
    // All client supplied names are missing from the master list.
    return clientList;
  }

  const missingItems = [];
  const masterListArray = [];

  // The master list is an array of objects while the client list is an
  // array of names.  Collect all the names in array from the master list
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
