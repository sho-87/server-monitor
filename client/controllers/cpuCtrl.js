var systemMonitor = angular.module('systemMonitor');

systemMonitor.controller('cpuCtrl', ['$scope', '$http', function($scope, $http){

	setInterval(function(){
		var responsePromise = $http.get("/api/cpu");

		responsePromise.success(function(data) {
			var cpu1Series = [];

			cpu1Series.push([data[data.length-1]["timeCollected"], data[data.length-1]["cpuUsage"]["cpu1"]])

			$scope.cpu1 = cpu1Series;
		});

		responsePromise.error(function() {
			alert("AJAX failed to get data!");
		});
	}, 1000)

}])