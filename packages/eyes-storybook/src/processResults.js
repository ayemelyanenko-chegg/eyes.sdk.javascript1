'use strict';
const flatten = require('lodash.flatten');
const chalk = require('chalk');
const {TestResultsError, TestResultsFormatter} = require('@applitools/eyes-sdk-core');
const uniq = require('./uniq');
const concurrencyMsg = require('./concurrencyMsg');
const defaultConfig = require('./defaultConfig');

function processResults({results = [], totalTime, testConcurrency}) {
  let outputStr = '\n';
  const formatter = new TestResultsFormatter();

  let testResults = results.map(r => r.resultsOrErr);
  testResults = flatten(testResults).filter(r => r.constructor.name !== 'Error');
  const unresolved = testResults.filter(r => r.getIsDifferent());
  const passedOrNew = testResults.filter(r => !r.getIsDifferent());

  let errors = results.map(({title, resultsOrErr}) =>
    Array.isArray(resultsOrErr)
      ? resultsOrErr.map(err => ({err, title}))
      : [{err: resultsOrErr, title}],
  );
  errors = flatten(errors).filter(({err}) => err.constructor.name === 'Error');

  const hasResults = unresolved.length || passedOrNew.length;
  const seeDetailsStr =
    hasResults && `See details at ${(passedOrNew[0] || unresolved[0]).getAppUrls().getBatch()}`;

  if (hasResults) {
    outputStr += `${seeDetailsStr}\n\n`;
  }

  outputStr += '[EYES: TEST RESULTS]:\n\n';
  if (passedOrNew.length > 0) {
    outputStr += testResultsOutput(passedOrNew);
  }
  if (unresolved.length > 0) {
    outputStr += testResultsOutput(unresolved);
  }
  if (errors.length) {
    const sortedErrors = errors.sort((a, b) => a.title.localeCompare(b.title));
    outputStr += uniq(
      sortedErrors.map(
        ({title, err}) => `${title} - ${chalk.red('Failed')} ${err.message || err.toString()}`,
      ),
    ).join('\n');
    outputStr += '\n';
  }

  if (!errors.length && !hasResults) {
    outputStr += 'Test is finished but no results returned.\n';
  }

  if (errors.length && !unresolved.length) {
    outputStr += chalk.red(
      `\nA total of ${errors.length} stor${
        errors.length > 1 ? 'ies' : 'y'
      } failed for unexpected error${errors.length > 1 ? 's' : ''}.`,
    );
  } else if (unresolved.length && !errors.length) {
    outputStr += chalk.keyword('orange')(
      `\nA total of ${unresolved.length} difference${
        unresolved.length > 1 ? 's were' : ' was'
      } found.`,
    );
  } else if (unresolved.length || errors.length) {
    outputStr += chalk.red(
      `\nA total of ${unresolved.length} difference${
        unresolved.length > 1 ? 's were' : ' was'
      } found and ${errors.length} stor${errors.length > 1 ? 'ies' : 'y'} failed for ${
        errors.length > 1 ? '' : 'an '
      }unexpected error${errors.length > 1 ? 's' : ''}.`,
    );
  } else if (passedOrNew.length) {
    outputStr += chalk.green(`\nNo differences were found!`);
  }

  if (hasResults) {
    outputStr += `\n${seeDetailsStr}\nTotal time: ${Math.round(totalTime / 1000)} seconds\n`;
  }

  if (Number(testConcurrency) === defaultConfig.testConcurrency) {
    outputStr += `\n${concurrencyMsg}\n`;
  }

  passedOrNew.forEach(formatter.addTestResults.bind(formatter));
  unresolved.forEach(formatter.addTestResults.bind(formatter));
  errors.forEach(error => {
    formatter.addTestResults(
      new TestResultsError({
        name: error.title,
        error: error.err,
      }),
    );
  });
  const exitCode = passedOrNew.length && !errors.length && !unresolved.length ? 0 : 1;
  return {
    outputStr,
    formatter,
    exitCode,
  };
}

function testResultsOutput(results) {
  let outputStr = '';
  const sortedTestResults = results.sort((a, b) => a.getName().localeCompare(b.getName()));
  sortedTestResults.forEach(result => {
    const storyTitle = `${result.getName()} [${result.getHostApp()}] [${result
      .getHostDisplaySize()
      .toString()}] - `;

    if (result.getIsNew()) {
      outputStr += `${storyTitle}${chalk.blue('New')}\n`;
    } else if (result.isPassed()) {
      outputStr += `${storyTitle}${chalk.green('Passed')}\n`;
    } else {
      outputStr += `${storyTitle}${chalk.keyword('orange')(`Unresolved`)}\n`;
    }
  });
  outputStr += '\n';
  return outputStr;
}

module.exports = processResults;
