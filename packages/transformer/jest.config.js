'use strict'

const baseConfig = require('../../jest.config.base')

const packageName = require('./package.json').name.split('@typesafe-store/').pop()
module.exports = {
    ...baseConfig,
    roots: [
        `<rootDir>/packages/${packageName}`,
    ],
    testMatch: [`<rootDir>/packages/${packageName}/src/test/testcases/*.ts`]
}