'use strict';
const {describe, it, beforeEach, afterEach} = require('mocha');
const {expect} = require('chai');
const makePluginExport = require('../../../src/plugin/pluginExport');
const {promisify: p} = require('util');
const psetTimeout = p(setTimeout);
const {makeVisualGridClient, Logger} = require('@applitools/visual-grid-client');
const makeConfig = require('../../../src/plugin/config');

describe('pluginExport', () => {
  let prevEnv, visualGridClient, logger, eyesConfig;

  async function startServer() {
    return {
      eyesPort: 123,
    };
  }

  beforeEach(() => {
    logger = new Logger(process.env.APPLITOOLS_SHOW_LOGS, 'eyes');
    visualGridClient = makeVisualGridClient({logger});
    prevEnv = process.env;
    process.env = {};
    eyesConfig = makeConfig().eyesConfig;
  });

  afterEach(() => {
    process.env = prevEnv;
  });

  it('sets eyesLegcyHooks', async () => {
    const pluginExport = makePluginExport({startServer, eyesConfig, visualGridClient, logger});
    let __module = {
      exports: () => ({bla: 'blah'}),
    };

    pluginExport(__module);
    const ret = await __module.exports(() => {}, {});
    expect(ret).to.eql({
      bla: 'blah',
      eyesPort: 123,
      eyesDisableBrowserFetching: false,
      eyesLayoutBreakpoints: undefined,
      eyesFailCypressOnDiff: true,
      eyesIsDisabled: false,
      eyesLegacyHooks: true,
      eyesBrowser: undefined,
      eyesTestConcurrency: 5,
    });

    __module = {
      exports: (_on, config) => {
        config.version = '6.5.0';
        config.experimentalRunEvents = true;
        return config;
      },
    };

    pluginExport(__module);
    const ret2 = await __module.exports(() => {}, {});
    expect(ret2).to.eql({
      eyesPort: 123,
      eyesDisableBrowserFetching: false,
      eyesLayoutBreakpoints: undefined,
      eyesFailCypressOnDiff: true,
      eyesLegacyHooks: false,
      eyesIsDisabled: false,
      eyesBrowser: undefined,
      eyesTestConcurrency: 5,
      version: '6.5.0',
      experimentalRunEvents: true,
    });
  });

  it('handles async module.exports', async () => {
    const pluginExport = makePluginExport({startServer, eyesConfig, visualGridClient});
    const __module = {
      exports: async () => {
        await psetTimeout(0);
        return {bla: 'bla'};
      },
    };

    pluginExport(__module);
    const ret = await __module.exports(() => {}, {});
    expect(ret).to.eql({
      bla: 'bla',
      eyesPort: 123,
      eyesDisableBrowserFetching: false,
      eyesLayoutBreakpoints: undefined,
      eyesFailCypressOnDiff: true,
      eyesLegacyHooks: true,
      eyesIsDisabled: false,
      eyesBrowser: undefined,
      eyesTestConcurrency: 5,
    });
  });

  it('works with disabled eyes', async () => {
    eyesConfig.eyesIsDisabled = true;
    const pluginExport = makePluginExport({
      startServer,
      eyesConfig,
      visualGridClient,
    });
    const __module = {
      exports: () => ({bla: 'ret'}),
    };

    pluginExport(__module);
    const ret = await __module.exports(() => {}, {});
    expect(ret).to.eql({
      bla: 'ret',
      eyesPort: 123,
      eyesIsDisabled: true,
      eyesDisableBrowserFetching: false,
      eyesLayoutBreakpoints: undefined,
      eyesLegacyHooks: true,
      eyesFailCypressOnDiff: true,
      eyesBrowser: undefined,
      eyesTestConcurrency: 5,
    });
  });

  it('works with dont fail cypress on diff', async () => {
    eyesConfig.eyesFailCypressOnDiff = false;
    const __module = {
      exports: () => ({bla: 'ret'}),
    };
    const pluginExport = makePluginExport({
      startServer,
      eyesConfig,
      visualGridClient,
    });

    pluginExport(__module);
    const ret = await __module.exports(() => {}, {});
    expect(ret).to.eql({
      bla: 'ret',
      eyesPort: 123,
      eyesDisableBrowserFetching: false,
      eyesLayoutBreakpoints: undefined,
      eyesLegacyHooks: true,
      eyesIsDisabled: false,
      eyesFailCypressOnDiff: false,
      eyesBrowser: undefined,
      eyesTestConcurrency: 5,
    });
  });

  it('works with eyes disableBrowserFetching', async () => {
    eyesConfig.eyesDisableBrowserFetching = true;
    const pluginExport = makePluginExport({startServer, eyesConfig});
    const __module = {
      exports: () => ({bla: 'ret'}),
    };

    pluginExport(__module);
    const ret = await __module.exports(() => {}, {});
    expect(ret).to.eql({
      bla: 'ret',
      eyesPort: 123,
      eyesDisableBrowserFetching: true,
      eyesLayoutBreakpoints: undefined,
      eyesLegacyHooks: true,
      eyesIsDisabled: false,
      eyesFailCypressOnDiff: true,
      eyesBrowser: undefined,
      eyesTestConcurrency: 5,
    });
  });
});
