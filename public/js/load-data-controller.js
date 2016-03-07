var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('LoadDataController', ['$scope', '$location',
    'ServerDataService', function($scope, $location, serverDataService) {
    $scope.getAllServerData = function() {
        serverDataService.getServerData().then(function() {
            $location.path('/schedule');
        });
    };

    $scope.getAllServerData();
}]);