'use strict'


module.exports = {
    transformIgnorePatterns: ['node_modules/'],
    collectCoverageFrom: ['src/**/*.{ts,tsx}'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testURL: 'http://localhost',
    rootDir: '../..',
    moduleFileExtensions: ['js', 'css', 'ts', 'tsx'],
    globals: {
        "ts-jest": {
            tsConfig: "tsconfig.json",
            isolatedModules: false
        }
    },
}