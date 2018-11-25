'use strict';
const puppeteer = require('puppeteer');
const getStories = require('./getStories');
const {makeVisualGridClient} = require('@applitools/visual-grid-client');
const {getProcessPageAndSerializeScript} = require('@applitools/visual-grid-client/browser');
const {presult} = require('@applitools/functional-commons');
const makeRenderStory = require('./renderStory');
const makeRenderStories = require('./renderStories');
const makeGetStoryData = require('./getStoryData');
const getChunks = require('./getChunks');
const ora = require('ora');
const flatten = require('lodash.flatten');
const chalk = require('chalk');

const CONCURRENT_PAGES = 3;

async function eyesStorybook({config, logger, performance, timeItAsync}) {
  const {storybookUrl} = config;
  const browser = await puppeteer.launch();
  const pages = await Promise.all(new Array(CONCURRENT_PAGES).fill().map(() => browser.newPage()));
  const page = pages[0];
  const {openEyes} = makeVisualGridClient(config);

  const processPageAndSerialize = `(${await getProcessPageAndSerializeScript()})()`;
  const getStoryData = makeGetStoryData({logger, processPageAndSerialize});
  const renderStory = makeRenderStory({
    logger,
    openEyes,
    performance,
    timeItAsync,
  });
  const renderStories = makeRenderStories({
    getChunks,
    getStoryData,
    pages,
    renderStory,
    storybookUrl,
  });

  try {
    page.on('console', msg => {
      logger.log(msg.args().join(' '));
    });

    const spinner = ora('Reading stories');
    spinner.start();
    await page.goto(storybookUrl);
    let stories = await page.evaluate(getStories);
    spinner.succeed();

    if (process.env.APPLITOOLS_STORYBOOK_DEBUG) {
      stories = stories.slice(0, 5);
    }

    logger.log(`starting to run ${stories.length} stories`);

    const [error, results] = await presult(
      timeItAsync('renderStories', async () => renderStories(stories)),
    );

    if (error) {
      console.log(chalk.red(`Error when rendering stories: ${error}`));
      return [];
    } else {
      return flatten(results);
    }
  } catch (ex) {
    logger.log(ex);
  } finally {
    logger.log('total time: ', performance['renderStories']);
    await browser.close();
  }
}

module.exports = eyesStorybook;
