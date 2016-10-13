var fileToInclude;
var standalone = window.navigator.standalone,
    userAgent = window.navigator.userAgent.toLowerCase(),
    safari = /safari/.test(userAgent),
    ios = /iphone|ipod|ipad/.test(userAgent),
    androidversion = /version/.test(userAgent),
    android = /android/.test(userAgent);
if (ios) {
    if (!standalone && !safari) {
        //uiwebview
        fileToInclude = 'cordova/iOS/cordova.js';
    }
} else if (android) {
    //not iOS
    if (androidversion && android) {
        //Android webview
        fileToInclude = 'cordova/android/cordova.js';
    }
}

if(fileToInclude) {
    var cordovaref = document.createElement("script");
    cordovaref.type = 'text/javascript';
    cordovaref.src = fileToInclude;
    document.getElementsByTagName('head')[0].appendChild(cordovaref);

    function onDeviceReady() {
        navigator.splashscreen.hide();

        document.addEventListener("backbutton", function (e) {
            e.preventDefault();
            if (confirm("Are you sure you want to exit from the app?")) {
                navigator.app.exitApp()
            }
        }, false);
    }
    document.addEventListener("deviceready", onDeviceReady, false);
}
