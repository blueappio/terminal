"use strict";

var app;
(function () {
    app = angular.module('terminal', ['ngMaterial', 'ngMdIcons'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('pink');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');
            $mdThemingProvider.alwaysWatchTheme(true);
        })
})();

app.run(['$document', '$window', function($document, $window) {
    var document = $document[0];
    document.addEventListener('click', function(event) {
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
                    '<md-progress-circular class="md-accent md-hue-1" md-mode="indeterminate" md-diameter="40" style="right: 20px;bottom: 10px;">' +
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
                $scope.terminaldata = $scope.terminaldata + ' <' + $scope.inputData + '>';
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
            })
            .catch(function (error) {
                dismissLoadingIndicator();
                console.error('Argh!', error, error.stack ? error.stack : '');
                badToast('Unable to connect.');
            });
    }

    if (!navigator.bluetooth) {
        badToast('Bluetooth not supported, which is required.');
    } else if (navigator.bluetooth.referringDevice) {
        $scope.onConnect();
    }

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

    $scope.terminal = terminalService;

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

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

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
                $scope.cancel();
            });
    };
}