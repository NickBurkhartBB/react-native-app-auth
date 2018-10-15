const fs = require('fs');
const glob = require("glob");
const path = require('path');
const appPath = path.join(process.cwd(), 'ios');
const package = require(path.join(process.cwd(), 'package.json'));

module.exports = function install(redirectSchemes) {
  const folders = fs.readdirSync(appPath);
  const projectFile = folders.find(file => file.indexOf('xcodeproj') > -1);
  const projectName = projectFile && projectFile.split('.')[0];

  const ignoreNodeModules = { ignore: "node_modules/**" };
  const ignoreNodeModulesAndPods = { ignore: ["node_modules/**", "ios/Pods/**"] };
  const appDelegateHeaderPaths = glob.sync("**/AppDelegate.h", ignoreNodeModules);
  const appDelegatePaths = glob.sync("**/AppDelegate.+(mm|m)", ignoreNodeModules);
  const appDelegatePath = findFileByAppName(appDelegatePaths, package ? package.name : null) || appDelegatePaths[0];
  const appDelegateHeaderPath = findFileByAppName(appDelegateHeaderPaths, package ? package.name : null) || appDelegateHeaderPaths[0];

  if (!appDelegatePath || !appDelegateHeaderPath) {
    console.warn(`Couldn't find AppDelegate. You might need to update it manually`);
    console.warn('You must manually link ios project.');
    return;
  }

  // add AppDelegate.h changes
  let appDelegateHeaderContents = fs.readFileSync(appDelegateHeaderPath, "utf8");
  const importStatement = '#import "RNAppAuthAuthorizationFlowManager.h"';
  const interfaceRegex = /(@interface AppDelegate : UIResponder <UIApplicationDelegate[^>]*)>/;
  const interfaceMatch = appDelegateHeaderContents.match(interfaceRegex);
  if (~appDelegateHeaderContents.indexOf(importStatement) || !interfaceMatch) {
    console.log(`"RNAppAuthAuthorizationFlowManager.h" header already imported.`);
  } else {
    const UIKitImport = `#import <UIKit/UIKit.h>`;
    appDelegateHeaderContents = appDelegateHeaderContents.replace(UIKitImport,
      `${UIKitImport}\n${importStatement}`);
    appDelegateHeaderContents = appDelegateHeaderContents.replace(interfaceMatch[1],
      `${interfaceMatch[1]}, RNAppAuthAuthorizationFlowManager`);
    const windowProp = '@property (nonatomic, strong) UIWindow *window;';
    const delegateProp = `@property(nonatomic, weak)id<RNAppAuthAuthorizationFlowManagerDelegate>authorizationFlowManagerDelegate;`;
    appDelegateHeaderContents = appDelegateHeaderContents.replace(windowProp,
      `${delegateProp}\n${windowProp}`);
    fs.writeFileSync(appDelegateHeaderPath, appDelegateHeaderContents);
  }

  // add AppDelegate.m changes (RCTLinkingManager / Deep Linking Logic)
  let appDelegateContents = fs.readFileSync(appDelegatePath, 'utf8');
  if (~appDelegateContents.indexOf('resumeExternalUserAgentFlowWithURL')) {
    console.log(`"AppDelegate.m" openURL has already been added.`);
  } else {
    if (~appDelegateContents.indexOf(`RCTLinkingManager`)) {
      appDelegateContents = appDelegateContents.replace(
        /(\[RCTLinkingManager[\n ]+application:application[\n ]+openURL:url[\n ]+sourceApplication:sourceApplication[\n ]+annotation:annotation\])/,
        '$1 || [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]');
    } else {
      appDelegateContents = appDelegateContents.replace('@end',
        `- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options
{
  return [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url];\n' +
}
@end`);
    }
    fs.writeFileSync(appDelegatePath, appDelegateContents);
  }

  // add Info.plist callback scheme
  const pListFilePath = path.join('ios', projectName, 'Info.plist');
  if (fs.existsSync(pListFilePath)) {
    let infoPListContents = fs.readFileSync(pListFilePath, 'utf8');

    if (infoPListContents.indexOf('AppAuthRedirectScheme') === -1) {
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
        (redirectSchemes.map(scheme => '\t\t\t\t<string>' + scheme + '</string>\n').join('\n')) +
        '\t\t\t</array>\n' +
        '\t\t</dict>\n'
      );

      fs.writeFileSync(pListFilePath, infoPListContents);
    }
  } else {
    console.warn('unable to find Info.plist.');
    console.warn('You must manually link ios project.');
  }

  // Helper that filters an array with AppDelegate.m paths for a path with the app name inside it
  // Should cover nearly all cases
  function findFileByAppName(array, appName) {
    if (array.length === 0 || !appName) return null;

    for (var i = 0; i < array.length; i++) {
      var path = array[i];
      if (path && path.indexOf(appName) !== -1) {
        return path;
      }
    }

    return null;
  }
}
