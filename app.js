var app;
(function(){
  app = angular.module('terminal', ['ngMaterial'])
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('blue')
      .accentPalette('pink');
    $mdThemingProvider.theme('success-toast');
    $mdThemingProvider.theme('error-toast');
    
    $mdThemingProvider.alwaysWatchTheme(true);
  })

})();

app.controller('mainController', function($scope, $mdToast){

    $scope.terminal = terminal;
    $scope.disable = true;

    function connectedWithDevice(){
      $scope.disable = false;
      $scope.terminal.onSuccess('connected with device');
    }

    function dataWritten(){
      console.log('Write successfully');
      $scope.terminal.terminaldata = $scope.terminal.terminaldata + ' <' +$scope.inputData + '>';
      $scope.inputData = '';
      $scope.$apply();
    }

    $scope.terminal.onSuccess = function(message){
        $mdToast.show(
          $mdToast.simple()
            .content(message)
            .position('top right')
            .hideDelay(2500)
            .theme("success-toast")
        );
    };

    $scope.terminal.onError = function(message){
        $mdToast.show(
          $mdToast.simple()
            .content(message)
            .position('top right')
            .hideDelay(2500)
            .theme("error-toast")
        );
    };

    $scope.sendClick = function () {
      console.log($scope.inputData);
      if ($scope.inputData === undefined) {
          $scope.terminal.onError('Enter Command to Send');
      } else if ($scope.inputData === ''){
          $scope.terminal.onError('Enter Command to Send');
      }else{
          terminal.writeData($scope.inputData.trim()).then(function () {
            return dataWritten();
          });
      }      
    };

    $scope.connectClick = function () {
        $scope.terminal.onSuccess('Connecting ....');
        terminal.connect().then(function () {
            return terminal.getConfigData().then(function (configData) {
                return terminal.configData = configData;
            }).then(function () {
                return connectedWithDevice();
            });
        }).catch(function (error) {
            console.error('Argh!', error, error.stack ? error.stack : '');
        });
    }

    if (navigator.bluetooth == undefined) {
        console.log("No navigator.bluetooth found.");
        $scope.terminal.onError("No navigator.bluetooth found.");
    } else if (navigator.bluetooth.referringDevice) {
        $scope.connectClick();
    }

});

