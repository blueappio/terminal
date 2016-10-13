cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-plugin-blueapp.blueappio",
        "file": "../plugins/cordova-plugin-blueapp/www/blueappio.js",
        "pluginId": "cordova-plugin-blueapp",
        "clobbers": [
            "blueappio"
        ]
    },
    {
        "file": "../plugins/cordova-plugin-dfu/www/dfuimpl.js",
        "id": "cordova-plugin-dfu.dfuimpl",
        "pluginId": "cordova-plugin-dfu",
        "clobbers": [
            "dfuimpl"
        ]
    },
    {
        "file": "../plugins/cordova-plugin-splashscreen/www/splashscreen.js",
        "id": "cordova-plugin-splashscreen.SplashScreen",
        "pluginId": "cordova-plugin-splashscreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "id": "cordova-plugin-statusbar.statusbar",
        "file": "../plugins/cordova-plugin-statusbar/www/statusbar.js",
        "pluginId": "cordova-plugin-statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-blueapp": "1.0.5",
    "cordova-plugin-splashscreen": "3.2.2",
    "cordova-plugin-nordic-dfu": "1.0.5",
    "cordova-plugin-statusbar": "2.1.3"
};
// BOTTOM OF METADATA
});