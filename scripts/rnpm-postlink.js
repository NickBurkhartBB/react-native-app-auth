const fs = require('fs');
const path = require('path');
const packageJson = require(path.join(process.cwd(), 'package.json'));

// read redirect scheme from env/env.js or package.json
let redirectScheme = null;
const envFilePath = path.join(process.cwd(), 'env', 'env.js');
if (fs.existsSync(envFilePath)) {
  const envInfo = require(envFilePath);
  redirectScheme = envInfo['react-native-app-auth'] && envInfo['react-native-app-auth'].redirectScheme;
}
if (!redirectScheme) {
  redirectScheme = packageJson['react-native-app-auth'] && packageJson['react-native-app-auth'].redirectScheme;
}

if (redirectScheme) {
  // convert string to array
  const redirectSchemes = (typeof redirectScheme === 'string') ?
    [ redirectScheme ] :
    redirectScheme;
  require('./rnpm-postlink-android')(redirectSchemes);
  require('./rnpm-postlink-ios')(redirectSchemes);
} else {
  console.warn('Unable to read redirectScheme from package.json.');
  console.warn('You will have to manually link the Android project.');
}
