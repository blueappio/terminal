"use strict";

var app;
(function () {
    app = angular.module('terminal', ['ngMaterial', 'ngMdIcons'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('indigo');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');
            $mdThemingProvider.alwaysWatchTheme(true);
        })
})();

var match,
    pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) {
        return decodeURIComponent(s.replace(pl, " "));
    },
    query = window.location.search.substring(1);

var urlParams = {};
while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);

var cordovaApp = urlParams['app'];

app.run(['$document', '$window', function ($document, $window) {
    var document = $document[0];
    document.addEventListener('click', function (event) {
        var hasFocus = document.hasFocus();
        if (!hasFocus) $window.focus();
    });
}]);

app.service('terminalService', function () {
    return new Terminal(navigator.bluetooth);
});

app.controller('mainController', function ($scope, $mdToast, $mdDialog, terminalService) {

    $scope.terminal = terminalService;
    $scope.terminaldata = '';
    $scope.deviceName = $scope.terminal.deviceName;
    $scope.isApp = false;

    var util = new Util();

    if (cordovaApp == 'true') {
        $scope.isApp = true;
    }

    // Disabling the mouse right click event
    document.addEventListener('contextmenu', function(event) { event.preventDefault();});

    function goodToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme("success-toast")
                .hideDelay(2500)
        );
    };

    function badToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme('error-toast')
                .hideDelay(2500)
        );
    };

    function showLoadingIndicator($event, text) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: false,
            template: '<md-dialog style="width: 250px;top:95px;margin-top: -170px;" aria-label="loadingDialog" ng-cloak>' +
            '<md-dialog-content>' +
            '<div layout="row" layout-align="center" style="padding: 40px;">' +
            '<div style="padding-bottom: 20px;">' +
            '<md-progress-circular md-mode="indeterminate" md-diameter="40" style="right: 20px;bottom: 10px;">' +
            '</md-progress-circular>' +
            '</div>' +
            '</div>' +
            '<div layout="row" layout-align="center" style="padding-bottom: 20px;">' +
            '<label>' + text + '</label>' +
            '</div>' +
            '</md-dialog-content>' +
            '</md-dialog>',
            locals: {
                items: $scope.items
            },
            controller: DialogController
        });

        function DialogController($scope, $mdDialog, items) {
            $scope.items = items;
            $scope.closeDialog = function () {
                $mdDialog.hide();
            }
        }
    }

    function dismissLoadingIndicator() {
        $mdDialog.cancel();
    };

    $scope.terminal.updateUI = function (value) {
        var tmpArray = new Uint8Array(value.buffer);
        for (var i = 0; i < tmpArray.length; i++) {
            $scope.terminaldata = $scope.terminaldata + tmpArray[i].toString(16);
        }
        $scope.$apply();
    };

    $scope.showSettingsDialog = function (ev) {
        $mdDialog.show({
            controller: SettingsController,
            templateUrl: 'settings.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        })
            .then(function (answer) {
                $scope.status = 'You said the information was "' + answer + '".';
            }, function () {
                $scope.status = 'You cancelled the dialog.';
            });
    };

    $scope.onClear = function () {
        $scope.terminaldata = '';
    }

    $scope.onSend = function () {
        if ($scope.inputData === undefined) {
            badToast('Enter Command to Send');
            return;
        }

        if ($scope.inputData === '') {
            badToast('Enter Command to Send');
            return;
        }

        var bytes = [];
        for (var i = 0; i < $scope.inputData.length; i = i + 2) {
            bytes.push(parseInt($scope.inputData[i] + $scope.inputData[i + 1], 16));
        }
        var bufView = new Uint8Array(bytes);

        $scope.terminal.writeData(bufView)
            .then(function () {
                if ($scope.terminal.localEcho) {
                    $scope.terminaldata = $scope.terminaldata + ' <' + $scope.inputData + '>';
                }
                $scope.inputData = '';
                $scope.$apply();
            })
            .catch(function (error) {
                badToast('Unable to send data.');
            });
    };

    $scope.onConnect = function () {
        showLoadingIndicator('', 'Connecting ....');
        $scope.terminal.connect()
            .then(function () {
                dismissLoadingIndicator();
                goodToast('Connected...');
                $scope.$apply();
            })
            .catch(function (error) {
                dismissLoadingIndicator();
                console.error('Argh!', error, error.stack ? error.stack : '');
                badToast(error);
            });
    }

    $scope.onDisconnect = function () {
        $scope.terminal.disconnect().then(function () {
            console.log('Device disconnected successfully');
            $scope.$apply();
        });
    }

    //Hack : waiting to load the plugin
    setTimeout(function () {
        if (!navigator.bluetooth) {
            badToast('Bluetooth not supported, which is required.');
        } else if (navigator.bluetooth.referringDevice) {
            $scope.onConnect();
        }
    }, 3000);

});

app.filter('range', function () {
    return function (input, total) {
        total = parseInt(total);

        for (var i = 0; i < total; i++) {
            input.push(i);
        }

        return input;
    };
});

function SettingsController($scope, $mdDialog, terminalService) {
    $scope.isApp = false;

    var util = new Util();

    if (cordovaApp == 'true') {
        $scope.isApp = true;
    }

    $scope.terminal = terminalService;
    $scope.deviceName = $scope.terminal.deviceName;

    if ($scope.terminal.localEcho) {
        $scope.localEcho = $scope.terminal.localEcho;
    } else {
        $scope.localEcho = false;
    }

    if ($scope.terminal.configBuffer) {
        $scope.rx = $scope.terminal.configBuffer.getUint8(0);
        $scope.tx = $scope.terminal.configBuffer.getUint8(1);
        $scope.rts = $scope.terminal.configBuffer.getUint8(2);
        $scope.cts = $scope.terminal.configBuffer.getUint8(3);

        var num = $scope.terminal.configBuffer.getUint8(4) & 0xFF;
        $scope.parity = num & 0xF;
        $scope.flowControl = num >> 4;

        $scope.baudRate = $scope.terminal.configBuffer.getUint8(5);
    } else {
        $scope.rx = 0;
        $scope.tx = 0;
        $scope.rts = 0;
        $scope.cts = 0;
        $scope.parity = 0;
        $scope.flowControl = 0;
        $scope.baudRate = 0;
    }

    //hard code to avoid changing them, disable in UI too.
    $scope.rx = 5;
    $scope.tx = 6;
    $scope.rts = 0;
    $scope.cts = 0;

    $scope.toggleEcho = function () {
        $scope.terminal.localEcho = $scope.localEcho;
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.onDFUSelect = function () {
        function dfuProcessResponse() {
            console.log("response");
        }

        function dfuProcessError() {
            console.log("error");
        }

        var message = {};
        message.fileName = "BluTerm.zip";
        message.backgroundColor = "white"; //background color to show progress
        message.borderColor = "blue"; // border color to show progress
        message.textColor = "blue"; // progress label color to show progress­
        message.uuid = $scope.terminal.bluetoothDevice.uuid; // connected peripheral uuid 
        message.hwVersion = $scope.terminal.hardwareVersion;
        message.swVersion = $scope.terminal.softwareVersion;

        setTimeout(function () {
            dfuimpl.request('message', JSON.stringify(message), dfuProcessResponse, dfuProcessError); // To start dfu process
        }, 3500);
    }

    $scope.submitClick = function () {
        var cfgData = [];
        cfgData.push($scope.rx);
        cfgData.push($scope.tx);
        cfgData.push($scope.rts);
        cfgData.push($scope.cts);
        cfgData.push($scope.flowControl << 4 | $scope.parity);
        cfgData.push($scope.baudRate);

        $scope.terminal.writeConfigData(new Uint8Array(cfgData))
            .then(function () {
                $scope.terminal.setDeviceName(new Uint8Array(util.stringToDecArray($scope.deviceName)))
                    .then(function () {
                        $scope.terminal.deviceName = $scope.deviceName;
                        $scope.cancel();
                    });
            });
    };
}

function Util() {
    this.stringToDecArray = function (str) {
        var dec, i;
        var dec_arr = [];
        if (str) {
            for (i = 0; i < str.length; i++) {
                dec = str.charCodeAt(i).toString(10);
                dec_arr.push(Number(dec));
            }
        }
        return dec_arr;
    };

    this.pushUniqueObj = function (array, item) {
        var found = false,
            idx = -1;
        if (array) {
            for (idx = 0; idx < array.length; idx++) {
                if (array[idx].uuid === item.uuid) {
                    found = true;
                    break;
                }
            }
            if (found) {
                array.splice(idx, 1, item);
                return array;
            } else {
                array.push(item);
                return array;
            }
        }
    };

    return this;
}
