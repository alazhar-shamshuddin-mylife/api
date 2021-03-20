/**
 * This file contains common helper functions related to environment variables.
 *
 * @author Alazhar Shamshuddin.
 */

/**
 * Checks if the specified environment variable is defined or forces the
 * process to exit with an error message.
 *
 * @param {string} envVar      The environment variable that should be defined.
 * @param {boolean} isEmptyOk  Optional.  Specify whether an environment
 *                               variable set to an empty string is okay.
 *                               Defaults to no.
 * @param {string} message     Optional.  A custom error message to write out
 *                               to stderr if the environment variable is not
 *                               defined.
 */
function checkEnvVarIsDefinedOrExit(envVar, isEmptyOk = false, message = '') {
  if (!(envVar in process.env)
    || (!isEmptyOk && !process.env[envVar])) {
    const errorMsg = message || `Required environment variable '${envVar}' is undefined.`;
    console.error(errorMsg); // eslint-disable-line no-console
    process.exit(1);
  }
}

module.exports = {
  checkEnvVarIsDefinedOrExit,
};
