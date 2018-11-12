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
	open ../intervaluebuilds/project-IOS/platforms/ios/inWallet.xcodeproj

ios-prod:
	cordova/build.sh IOS --clear
	cd ../intervaluebuilds/project-IOS && cordova build ios

ios-debug:
	cordova/build.sh IOS --dbgjs
	cd ../intervaluebuilds/project-IOS && cordova build ios
	open ../intervaluebuilds/project-IOS/platforms/ios/inWallet.xcodeproj

android:
	test -d "../intervaluebuilds" || mkdir ../intervaluebuilds
	cordova/build.sh ANDROID --clear
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/inWallet.apk

android-prod:
	cordova/build.sh ANDROID --clear
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/inWallet.apk

android-prod-fast:
	cordova/build.sh ANDROID
#	cd ../intervaluebuilds/project-ANDROID && cordova run android --device
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/inWallet.apk

android-debug:
	cordova/build.sh ANDROID --dbgjs --clear
	cd ../intervaluebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../intervaluebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../intervaluebuilds/inWallet.apk


android-debug-fast:
	cordova/build.sh ANDROID --dbgjs
	cd ../intervaluebuilds/project-ANDROID && cordova run android --device

win32:
	grunt.cmd desktop
	cp -rf node_modules ../intervaluebuilds/inWallet/win32/
	grunt.cmd inno32

win64:
	grunt.cmd inno64

linux64:
	grunt desktop
	cp -rf node_modules ../intervaluebuilds/inWallet/linux64/
	grunt linux64

osx64:
	grunt desktop
	cp -rf node_modules ../intervaluebuilds/inWallet/osx64/inWallet.app/Contents/Resources/app.nw/
	grunt dmg