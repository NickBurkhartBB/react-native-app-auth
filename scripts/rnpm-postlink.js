const path = require('path');
const packageJson = require(path.join(process.cwd(), 'package.json'));

const redirectScheme = packageJson['react-native-app-auth'] && packageJson['react-native-app-auth'].redirectScheme;

if (redirectScheme) {
  require('./rnpm-postlink-android')(redirectScheme);
  require('./rnpm-postlink-ios')(redirectScheme);
} else {
  console.warn('Unable to read redirectScheme from package.json.');
  console.warn('You will have to manually link the Android project.');
}
