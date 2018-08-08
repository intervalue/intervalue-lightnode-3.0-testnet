VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`

cordova-base:
	grunt dist-mobile

wp8-prod:
	cordova/build.sh WP8 --clear
	cordova/wp/fix-svg.sh
	echo -e "\a"

wp8-debug:
	cordova/build.sh WP8 --dbgjs
	cordova/wp/fix-svg.sh
	echo -e "\a"

ios:
	cordova/build.sh IOS --dbgjs
	cd ../intervaluebuilds/project-IOS && cordova build ios
	open ../intervaluebuilds/project-IOS/platforms/ios/InterValue.xcodeproj

ios-prod:
	cordova/build.sh IOS --clear
	cd ../intervaluebuilds/project-IOS && cordova build ios

ios-debug:
	cordova/build.sh IOS --dbgjs
	cd ../intervaluebuilds/project-IOS && cordova build ios
	open ../intervaluebuilds/project-IOS/platforms/ios/InterValue.xcodeproj

android:
	test -d "../intervaluebuilds" || mkdir ../intervaluebuilds
	cordova/build.sh ANDROID --clear
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/InterValue.apk

android-prod:
	cordova/build.sh ANDROID --clear
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/InterValue.apk

android-prod-fast:
	cordova/build.sh ANDROID
#	cd ../intervaluebuilds/project-ANDROID && cordova run android --device
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/InterValue.apk

android-debug:
	cordova/build.sh ANDROID --dbgjs --clear
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/InterValue.apk


android-debug-fast:
	cordova/build.sh ANDROID --dbgjs
	cd ../intervaluebuilds/project-ANDROID && cordova run android --device

win32:
	grunt.cmd desktop
	cp -rf node_modules ../intervaluebuilds/InterValue/win32/
	grunt.cmd inno32

win64:
	grunt.cmd inno64

linux64:
	grunt desktop
	cp -rf node_modules ../intervaluebuilds/InterValue/linux64/
	grunt linux64

osx64:
	grunt desktop
	cp -rf node_modules ../intervaluebuilds/InterValue/osx64/InterValue.app/Contents/Resources/app.nw/
	grunt dmg