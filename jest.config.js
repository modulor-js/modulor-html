module.exports = {
  "testURL": "http://localhost",
  "transform": {
    "^.+\\.js$": "babel-jest"
  },
  "moduleNameMapper": {
    "^web-components-polyfill$": "document-register-element",
    "^@modulor-js/html/directives$": "<rootDir>/src/directives.js",
    "^@modulor-js/(.*)$": "<rootDir>/src/$1"
  }
};
