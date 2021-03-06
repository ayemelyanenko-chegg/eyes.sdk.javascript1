const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const {configLoader} = require('../loaders/config-loader')
const {createReport} = require('./create')
const {sendReport} = require('./send')
const uploadToStorage = require('./upload')

const DEFAULT_CONFIG = {
  metaDir: '',
  resultDir: '',
}

async function report(options) {
  const config = {
    ...DEFAULT_CONFIG,
    ...configLoader(options),
    ...options,
  }
  const cwd = process.cwd()
  const junit = fs.readFileSync(path.resolve(cwd, config.resultDir, 'coverage-test-report.xml'), {
    encoding: 'utf-8',
  })
  const metadata = require(path.resolve(cwd, config.metaDir, 'coverage-tests-metadata.json'))

  process.stdout.write(`\nSending report to QA dashboard ${config.sandbox ? '(sandbox)' : ''}... `)
  const report = createReport({
    reportId: config.reportId,
    name: config.name,
    sandbox: config.sandbox,
    junit,
    metadata,
  })

  const result = await sendReport(report)
  process.stdout.write(result.isSuccessful ? chalk.green('Done!\n') : chalk.red('Failed!\n'))
  if (!result.isSuccessful) {
    console.log(result.message)
  }
  await uploadToStorage({
    sdkName: config.name,
    reportId: config.reportId,
    isSandbox: config.sandbox,
    payload: JSON.stringify(report),
  }).catch(err => {
    console.log(chalk.gray('Error uploading results to Azure:', err.message))
  })
}

module.exports = report
