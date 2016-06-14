(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTools', tools);

    /** @ngInject */
    function tools() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/tools/tools.html',
            controller: ToolsController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ToolsController(osApi, $state, $stateParams) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            var vm = this;
            vm.datasource = $stateParams.datasource;
            osApi.query("os_tools").then(function(response){
                vm.tools = response.data;
            });
            vm.explore = function(tool, datasource) {
                $state.go(tool, {
                    datasource: datasource
                });
            };
        }
    }

})();
