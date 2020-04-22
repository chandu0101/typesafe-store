const { paths: rewiredPaths } = require('react-app-rewired');
const { scriptVersion } = rewiredPaths;
const paths = require(`${scriptVersion}/config/paths`);

module.exports = {
    webpack: (config) => {
        // Disable eslint
        config.module.rules.splice(1, 1);

        // Disable type checking
        paths.appTsConfig = undefined;

        return config;
    },
};