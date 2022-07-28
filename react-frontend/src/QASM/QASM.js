// Definitions for base QASM class.
const constants = require("./constants.js");
const fs = require("fs");

module.exports = class QASM {
    readConfig() {
        return JSON.parse(fs.readFileSync(constants.local_paths.CONFIG_PATH));
    }
}