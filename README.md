# RemoveCordovaSplashscreen
It is mostly recommended to not put branding in the splashscreen and to make it look as the empty state of the first screen. So here is an explanation and script which helps to achieve that opening cordova app will have a blank page with the background color of your desire and statusbar of your desired style, for the 0-1 seconds before your first cordova page loads.

We will assume your desired background color is black and desired status bar text color is white.
Make sure to have latest cordova version and platform/plugins versions.

IMPORTANT: Even after configuring cordova without the splash screens, the default cordova splash screen which appear in cordova-ios and cordova-android templates will still be bundled in your cordova app and make its size much bigger than necessary.
The template is copied to the platform folder when adding the platform and it includes the images in the subfolders here:
https://github.com/apache/cordova-android/tree/master/bin/templates/project/res
https://github.com/apache/cordova-ios/tree/master/bin/templates/project/__PROJECT_NAME__/Images.xcassets
so to get rid of them I wrote a cordova hook which runs after you add the platform. To solve it add the clearSplashAndIcons.js file to <cordova-root-folder>/scripts folder and to your config.xml file:
  <hook src="scripts/clearSplashAndIcons.js" type="after_platform_add" />

# ios + android
First of all remove splashscreen plugin if you have it and in config.xml remove the splashscreen preferences except:
```
    <preference name="SplashScreen" value="none" />
    <preference name="SplashScreenDelay" value="0" />
    <preference name="BackgroundColor" value="0xff000000" />
    <preference name="SplashScreenBackgroundColor" value="#000000" />
    <preference name="StatusBarOverlaysWebView" value="false" />
    <preference name="StatusBarBackgroundColor" value="#000000" />
    <preference name="StatusBarStyle" value="lightcontent" />
```

# android
Android screens are "activities" and their designs are called "styles" which are combined into "themes". So after removing the splashscreen the app will display briefly the initial main activity before opening the first cordova page. So to achieve the desired result we need to change the theme of the initial main activity and declared in the custom theme the desired colors.
To achieve this do the following:

1. Create <cordova-root-folder>/res/native/android/res/values/custom-colors.xml file with the content:
```
  <?xml version="1.0" encoding="utf-8" ?>
  <resources>
      <color name="custom_window_background">#000000</color>
  </resources>
```	
2. Create <cordova-root-folder>/res/native/android/res/values/custom-styles.xml file with the content:
```
  <?xml version="1.0" encoding="utf-8" ?>
  <resources>
      <!-- inherit from the material theme -->
      <style name="CustomTheme" parent="android:Theme.NoTitleBar">
          <item name="android:windowBackground">@color/custom_window_background</item>
      </style>
  </resources>
```	
3. In config.xml remove all android platform splash images tags and add:
```
  <platform name="android">
      <resource-file src="res/native/android/res/values/custom-colors.xml" target="app/src/main/res/values/custom-colors.xml" />
      <resource-file src="res/native/android/res/values/custom-styles.xml" target="app/src/main/res/values/custom-styles.xml" />
      <edit-config file="AndroidManifest.xml" mode="merge" target="/manifest/application/activity[@android:name='MainActivity']">
          <activity android:name="MainActivity" android:theme="@style/CustomTheme" />
      </edit-config>
  </platform>
```  
4. Remove and add android platform before testing changes
	
5. To change color and icon of the "recents/overview screen" displayed when pressing android "overview button" https://developer.android.com/guide/components/activities/recents (prefer to add those lines than adding a whole new plugin for it https://github.com/tomloprod/cordova-plugin-headercolor):
	
	5.1. add color and icon resources

	5.2. in MainActivity.java add:
	```
	@Override
	protected void onResume() {
		super.onResume();

		// Change header color and icon in overview/recents screen
		// Available only from API 21+
		// NOTE: Must run this in onResume and not onCreate or otherwise in the first runs the icon will not be set and instead the default app icon will be used.
		if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
			// See: https://github.com/aosp-mirror/platform_frameworks_base/blob/lollipop-release/packages/SystemUI/src/com/android/systemui/recents/model/Task.java#L147
			// https://developer.android.com/reference/android/app/ActivityManager.TaskDescription
			android.graphics.Bitmap icon = android.graphics.BitmapFactory.decodeResource(getResources(), R.drawable.recentAppsScreenHeaderIcon);
			android.app.ActivityManager.TaskDescription taskDescription = new android.app.ActivityManager.TaskDescription(getResources().getString(R.string.app_name), icon, android.support.v4.content.res.ResourcesCompat.getColor(getResources(), R.color.overviewWindowHeaderColor, null));
			// https://developer.android.com/reference/android/app/Activity#setTaskDescription(android.app.ActivityManager.TaskDescription)
			((android.app.Activity)this).setTaskDescription(taskDescription);
		}
	}
	```
	- NOTE: This will get deleted on next platform re-adding

  Resources:
  - Important to understand android styles.xml and colors.xml: https://developer.android.com/guide/topics/resources/providing-resources
  - Important to understand android themes: https://developer.android.com/guide/topics/ui/look-and-feel/themes
 
 # ios
 ios, unlike android, displays a configured app image before the app process starts. Its called launch image. ios screens are called view controllers and ios flow of screens is called storyboard. In latest versions ios allows and recommends to insert a launch storyboard instead of a static launch image. Cordova supports getting an image in config.xml configuration and creating the launch storyboard for us. Since the launch screen needs to support different screen sizes, there is an important naming convention to use. The image file name should be: `Default@2x~universal~anyany.png` where you should create a 2732x2732 black square which will be the background. Using cordova statusbar plugin does not change the statusbar style at the launch screen so additional modification is required. Here are all the required steps:
 
 1. create a simple 100x100 black square svg file (file.svg):
 ```
 <?xml version="1.0" encoding="UTF-8"?>
  <svg width="100px" height="100px" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect x="0" y="0" width="100" height="100" fill="#000000"></rect>
  </svg>
```  
 2. create 2732x2732 black square png from the svg by using the imagemagick (https://www.imagemagick.org/) convert utility command:
 ```
  convert file.svg -resize 2732x2732  Default@2x~universal~anyany.png
  ```
  
 3. place the png in res/screens/ios folder of the cordova project
 
 4. in config.xml under platform ios tag insert the tags:
 
				4.1 `<splash src="res/screens/ios/Default@2x~universal~anyany.png" />`
					- the tag must not have width and height set!
					
				4.2 `<config-file parent="UIStatusBarStyle" platform="ios" target="*-Info.plist"><string>UIStatusBarStyleLightContent</string></config-file>`
					- using the status bar plugin without this does not change the status bar at launch
 
 
 5. in xcode project (assuming you use UIWebView. similar solution for WKWebView) open "classes->MainViewController.m" and in the end of "viewDidLoad" method add: `"self.webView.opaque = false;"`
 
				- NOTE: This will get deleted on next cordova platform re-adding
 
 
 Resources:
 - https://blog.phonegap.com/displaying-a-phonegap-app-correctly-on-the-iphone-x-c4a85664c493
 - https://medium.com/@photokandy/phonegap-build-supports-ios-launch-storyboards-44a4180bfafe
 - https://cdn.rawgit.com/kerrishotts/launch-storyboard-images-previewer/0.3-release/index.html
