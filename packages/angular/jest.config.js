'use strict'

const baseConfig = require('../../jest.config.base')

const packageName = require('./package.json.js.js').name.split('@typesafe-store/').pop()
module.exports = {
    ...baseConfig,
    roots: [
        `<rootDir>/packages/${packageName}`,
    ],
}