const fs = require('fs');
const path = require('path');
const appPath = path.join(process.cwd(), 'ios');
module.exports = function install(redirectScheme) {
  const folders = fs.readdirSync(appPath);
  const projectFile = folders.find(file => file.indexOf('xcodeproj') > -1);
  const projectName = projectFile && projectFile.split('.')[0];

  const pListFilePath = path.join('ios', projectName, 'Info.plist');
  if (fs.existsSync(pListFilePath)) {
    let infoPListContents = fs.readFileSync(pListFilePath, 'utf8');

    if (infoPListContents.indexOf(redirectScheme) === -1) {
      // Add to redirectScheme to CFBundleURLTypes
      infoPListContents = infoPListContents.replace(
        /<key>CFBundleURLTypes<\/key>\s*\n\s*<array>/,
        '<key>CFBundleURLTypes</key>\n' +
        '\t<array>\n' +
        '\t\t<dict>\n' +
        '\t\t\t<key>CFBundleURLName</key>\n' +
        '\t\t\t<string>AppAuthRedirectScheme</string>\n' +
        '\t\t\t<key>CFBundleURLSchemes</key>\n' +
        '\t\t\t<array>\n' +
        '\t\t\t\t<string>' + redirectScheme + '</string>\n' +
        '\t\t\t</array>\n' +
        '\t\t</dict>\n'
      );

      fs.writeFileSync(pListFilePath, infoPListContents);
    }
  } else {
    console.warn('unable to find Info.plist.');
    console.warn('You must manually link ios project.');
  }
}