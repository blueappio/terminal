cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
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
        "file": "../plugins/cordova-plugin-whitelist/whitelist.js",
        "id": "cordova-plugin-whitelist.whitelist",
        "pluginId": "cordova-plugin-whitelist",
        "runs": true
    },
    {
        "file": "../plugins/cordova-plugin-blueapp/www/blueappio.js",
        "id": "cordova-plugin-blueapp.blueappio",
        "pluginId": "cordova-plugin-blueapp",
        "clobbers": [
            "blueappio"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-dfu": "1.0.3",
    "cordova-plugin-splashscreen": "3.2.2",
    "cordova-plugin-whitelist": "1.0.0",
    "cordova-plugin-blueapp": "1.0.5"
}
// BOTTOM OF METADATA
});