/**
 * This file contains unit tests for envHelper.js.
 *
 * @author Alazhar Shamshuddin.
 */

/* eslint no-console: ["error", { allow: ["error"] }] */

const envHelper = require('../../helpers/envHelper');

const origConsoleError = console.error;
const origProcessExit = process.exit;
let consolErrorOutput;
let processExitValue;

const mockConsoleError = (msg) => {
  consolErrorOutput = msg;
};

const mockProcessExit = (num) => {
  processExitValue = num;
};

beforeEach(() => {
  console.error = mockConsoleError;
  process.exit = mockProcessExit;
  consolErrorOutput = undefined;
  processExitValue = undefined;
});

afterEach(() => {
  console.error = origConsoleError;
  process.exit = origProcessExit;
});

describe('checkEnvVarIsDefinedOrExit()', () => {
  test('Nothing happens with a defined environment variable.', () => {
    envHelper.checkEnvVarIsDefinedOrExit('PATH');
    expect(consolErrorOutput).toBe(undefined);
    expect(processExitValue).toBe(undefined);
  });

  test('An undefined environment variable exists with a default error message.', () => {
    const undefinedEnvVar = 'ENV_VAR_DOES_NOT_EXIST';
    envHelper.checkEnvVarIsDefinedOrExit(undefinedEnvVar, false);
    expect(consolErrorOutput).toBe(`Required environment variable '${undefinedEnvVar}' is undefined.`);
    expect(processExitValue).toBe(1);
  });

  test('An undefined environment variable exists with a custom error message.', () => {
    const undefinedEnvVar = 'ENV_VAR_DOES_NOT_EXIST';
    const customErrorMsg = 'This is my custom error message.';
    envHelper.checkEnvVarIsDefinedOrExit(undefinedEnvVar, false, customErrorMsg);
    expect(consolErrorOutput).toBe(customErrorMsg);
    expect(processExitValue).toBe(1);
  });

  test('Nothing happens with an empty environment variable if isEmptyOkay is true', () => {
    const emptyEnvVar = 'ENV_VAR_EMPTY';
    process.env[emptyEnvVar] = '';
    envHelper.checkEnvVarIsDefinedOrExit(emptyEnvVar, true);
    expect(consolErrorOutput).toBe(undefined);
    expect(processExitValue).toBe(undefined);
  });

  test('An empty environment variable exits with a default error message if isEmptyOkay is false', () => {
    const emptyEnvVar = 'ENV_VAR_EMPTY';
    process.env[emptyEnvVar] = '';
    envHelper.checkEnvVarIsDefinedOrExit(emptyEnvVar, false);
    expect(consolErrorOutput).toBe(`Required environment variable '${emptyEnvVar}' is undefined.`);
    expect(processExitValue).toBe(1);
  });

  test('An empty environment variable exits with a custom error message if isEmptyOkay is false', () => {
    const emptyEnvVar = 'ENV_VAR_EMPTY';
    const customErrorMsg = 'This is my custom error message.';
    process.env[emptyEnvVar] = '';
    envHelper.checkEnvVarIsDefinedOrExit(emptyEnvVar, false, customErrorMsg);
    expect(consolErrorOutput).toBe(customErrorMsg);
    expect(processExitValue).toBe(1);
  });
});
