const fs = require('fs');
const path = require('path');
const appBuildGradlePath = path.join('android', 'app', 'build.gradle');
const projectSettings = path.join('android', 'settings.gradle');

module.exports = function install(redirectScheme) { 

    let buildGradleContents = fs.readFileSync(appBuildGradlePath, 'utf8');

    // 1) Upgrade support version to 25.3.1
    buildGradleContents = buildGradleContents.replace(
      'com.android.support:appcompat-v7:23.0.1', 
      'com.android.support:appcompat-v7:25.3.1');

    // 2) Upgrade compile version
    buildGradleContents = buildGradleContents.replace(
      'compileSdkVersion 24', 
      'compileSdkVersion 25');

    // 3) Add redirectScheme to android config
    if (buildGradleContents.indexOf(redirectScheme) === -1) {
      buildGradleContents = buildGradleContents.replace(
        /(applicationId[^\n]+)\n/, 
        '$1\nmanifestPlaceholders =[\nappAuthRedirectScheme: "' + redirectScheme + '"\n]\n');
    }

    // 4) fix scoped package name in app/build.gradle
    buildGradleContents = buildGradleContents.replace(
      /':@brandingbrand\/react-native-app-auth'/g,
      '\':react-native-app-auth\'');

    // 5) Write file
    fs.writeFileSync(appBuildGradlePath, buildGradleContents);

    // clean up scoped package name in settings.gradle
    let settingsGradleContents = fs.readFileSync(projectSettings, 'utf8');
    settingsGradleContents = settingsGradleContents.replace(
      /':@brandingbrand\/react-native-app-auth'/g,
      '\':react-native-app-auth\'');
      fs.writeFileSync(projectSettings, settingsGradleContents);
  }