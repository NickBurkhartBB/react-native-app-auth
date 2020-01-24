const fs = require('fs');
const path = require('path');
const appBuildGradlePath = path.join('android', 'app', 'build.gradle');
const appManifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
const projectSettings = path.join('android', 'settings.gradle');
module.exports = function install(redirectSchemes) {
  // If only initing iOS android won't exist
  if (fs.existsSync(appBuildGradlePath)) {
    let buildGradleContents = fs.readFileSync(appBuildGradlePath, 'utf8');
    // 1) Upgrade support version to 25.3.1
    buildGradleContents = buildGradleContents.replace(
      'com.android.support:appcompat-v7:23.0.1', 
      'com.android.support:appcompat-v7:25.3.1');

    // 2) Upgrade compile version
    buildGradleContents = buildGradleContents.replace(
      'compileSdkVersion 24', 
      'compileSdkVersion 25');

    // 3) fix scoped package name in app/build.gradle
    buildGradleContents = buildGradleContents.replace(
      /':@brandingbrand\/react-native-app-auth'/g,
      '\':react-native-app-auth\'');

    // 4) Write file
    fs.writeFileSync(appBuildGradlePath, buildGradleContents);

    // add redirect schemes to AndroidManifest
    let appManifestContents = fs.readFileSync(appManifestPath, 'utf8');
    const appAuthReceiver = 'net.openid.appauth.RedirectUriReceiverActivity';
    // look for receiver in manifest, and add if not there
    if (appManifestContents.indexOf(appAuthReceiver) === -1) {
      const receiverActivity = `
      <activity
        android:name="${appAuthReceiver}"
        xmlns:tools="http://schemas.android.com/tools"
              tools:node="replace">
        ${redirectSchemes.map(scheme => {
          return `
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="${scheme}"/>
            </intent-filter>
          `;
        }).join('\n')}
      </activity>`;
      appManifestContents = appManifestContents.replace('</application>', receiverActivity + '\n</application>');

      fs.writeFileSync(appManifestPath, appManifestContents);
    }


    // clean up scoped package name in settings.gradle
    let settingsGradleContents = fs.readFileSync(projectSettings, 'utf8');
    settingsGradleContents = settingsGradleContents.replace(
      /':@brandingbrand\/react-native-app-auth'/g,
      '\':react-native-app-auth\'');
    fs.writeFileSync(projectSettings, settingsGradleContents);  
  }
  }