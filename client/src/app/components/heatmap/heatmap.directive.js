(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHeatmap', heatmap);

    /** @ngInject */
    function heatmap() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/heatmap/heatmap.html',
            controller: HeatmapController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HeatmapController(d3, osApi, osCohortService, $state, $timeout, $scope, $stateParams, $window, ocpu) {

            var vm = this;
            vm.datasource = osApi.getDataSource();

            var elChart = $("#heatmap-chart");
            var data;

//            osApi.setBusy(true);
            osApi.query("brca_psi_bradleylab_miso", {
                '$limit': 500
            }).then(function(response) {
                data = response;
                osApi.getCpuApi().getOheatmap(
                    {output:"svg",width:10,height:10,data:{"data":[[0.02,0.01,0.02,0.01,0.04,0.05,0.01,0.03,0.03,0.02,0.01,0.03,0.04,0.01,0.02,0.02,0.02,0.01,0.04,0.05,0.03,0.05,0.02,0.03,0.01,0.02,0.03,0.03,0.02,0.01,0.03,0.03,0.01,0.03,0.03,0.02,0.02,0.03,0.01,0.01,0.03,0.02,0.02,0.02,0.01,0.01,0.03,0.02,0.02,0.03,0.04,0.05,0.05,0.01,0.02,0.01,0.04,0.01,0.03,0.03,0.02,0.01,0.03,0.03,0.03,0.04,0.03,0.06,0.02,0.05,0.06,0.04,0.03,0.03,0.02,0.02,0.01,0.01,0.01,0.01,0.04,0.09,0.02,0.02,0.01,0.02,0.02,0.03,0.02],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0.03,0.07,0.12,0.07,0.1,0.27,0.14,0.04,0.03,0.07,0.02,0.04,0.04,0.05,0.07,0.13,0.26,0.13,0.16,0.12,0.01,0.03,0.15,0.13,0.09,0.08,0.04,0.18,0.06,0.21,0.14,0.06,0.25,0.09,0.01,0.1,0.25,0.02,0.09,0.08,0.14,0.05,0.09,0.06,0.03,0.02,0.03,0.13,0.09,0.04,0.19,0.12,0.04,0.11,0.02,0.04,0.04,0.07,0.16,0.06,0.08,0.03,0.08,0.04,0.04,0.17,0.06,0.12,0.04,0.07,0.26,0.13,0.09,0.09,0.15,0.11,0.06,0.15,0.04,0.1,0.06,0.06,0.02,0.06,0.08,0.16,0.15,0.03,0.14],[0.48,0.41,0.09,0.51,0.43,0.69,0.35,0.58,0.57,0.08,0.25,0.08,0.43,0.49,0.27,0.32,0.45,0.15,0.5,0.16,0.53,0.57,0.76,0.21,0.26,0.18,0.51,0.18,0.49,0.25,0.17,0.56,0.27,0.61,0.22,0.67,0.28,0.37,0.67,0.32,0.27,0.22,0.17,0.2,0.43,0.34,0.61,0.55,0.35,0.48,0.52,0.16,0.2,0.72,0.26,0.33,0.42,0.52,0.62,0.13,0.52,0.34,0.54,0.1,0.45,0.47,0.49,0.75,0.63,0.62,0.33,0.09,0.51,0.73,0.33,0.39,0.29,0.46,0.23,0.67,0.47,0.33,0.69,0.45,0.18,0.42,0.44,0.32,0.67],[0,0,0,0.53,0.77,0,0.43,0.52,0.81,0.28,0,0.73,0,0,0.36,0,0,0,0,0.64,0,0,0,0,0,0.22,0,0,0.65,0,0,0.59,0,0.52,0,0,0,0,0,0.78,0.42,0.41,0.32,0.52,0.44,0,0.65,0.42,0.52,0,0,0.44,0,0.61,0.53,0,0.38,0.73,0,0,0.32,0.66,0,0.22,0,0,0.37,0,0.54,0,0,0,0.51,0,0,0.39,0.76,0.4,0.24,0.35,0,0.48,0.44,0.4,0,0,0,0,0],[0,0,0,0,0,0,0,0.3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.49,0,0,0,0,0,0,0,0,0,0,0,0.46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.07],[0.01,0.03,0.21,0.06,0.02,0.03,0.01,0.01,0.02,0.04,0.06,0.04,0.03,0.1,0.01,0.08,0.05,0.03,0.17,0.03,0.04,0.04,0.05,0.05,0.02,0.03,0.07,0.07,0.02,0.1,0.02,0.04,0.06,0.03,0.03,0.18,0.03,0.03,0.02,0.01,0,0.05,0.01,0,0.01,0.06,0.01,0.05,0.01,0.01,0.04,0,0.1,0.06,0.03,0.03,0.01,0.01,0.06,0.02,0.07,0,0.05,0.05,0.1,0.01,0.02,0.03,0.02,0.04,0.23,0.15,0.05,0.04,0.06,0.01,0.06,0.01,0.01,0.04,0.03,0.01,0.01,0.02,0.03,0.06,0.03,0.02,0.07],[0.04,0.11,0.05,0.02,0.05,0.2,0.03,0.23,0.29,0.04,0.04,0.08,0.08,0.1,0.29,0.49,0.11,0.05,0.09,0.12,0.1,0.1,0.14,0.06,0.07,0.13,0.16,0.04,0.07,0.04,0.25,0.21,0.08,0.11,0.06,0.18,0.21,0.09,0.22,0.03,0.14,0.12,0.05,0.03,0.04,0.05,0.08,0.09,0.04,0.03,0.04,0.02,0.41,0.19,0.13,0.07,0.25,0.06,0.12,0.06,0.14,0.02,0.25,0.01,0.36,0.07,0.08,0.15,0.06,0.29,0.22,0,0.06,0.19,0.1,0.12,0.14,0.05,0.04,0.12,0.24,0.04,0.06,0.27,0.06,0.14,0.08,0.09,0.34],[0.22,0.2,0.18,0.16,0.19,0.22,0.21,0.09,0.31,0.16,0.05,0.21,0.11,0.14,0.17,0.24,0.38,0.13,0.49,0.2,0.12,0.08,0.45,0.14,0.09,0.06,0.23,0.18,0.03,0.23,0.22,0.08,0.07,0.26,0.17,0,0.05,0.17,0.12,0.13,0.11,0.15,0.13,0.07,0.02,0.07,0.07,0.22,0.06,0.1,0.03,0.04,0.18,0.25,0.05,0.05,0.09,0.17,0.06,0.09,0.06,0.03,0.15,0.02,0.22,0.12,0.15,0.14,0.08,0.24,0.47,0.26,0.09,0.26,0.23,0.11,0.1,0.11,0.15,0.11,0.34,0.05,0.11,0.19,0.17,0.23,0.11,0.3,0.18],[0.04,0.13,0.11,0.03,0.08,0.13,0.22,0.04,0.21,0.09,0.1,0.14,0.04,0.12,0.16,0.15,0.16,0.09,0.14,0.34,0.11,0.12,0.05,0.06,0.05,0.28,0.02,0.15,0.09,0.13,0.09,0.07,0.09,0.07,0.2,0.14,0.07,0.15,0.07,0.08,0.07,0.03,0.21,0.1,0.09,0.13,0.07,0.15,0.07,0.05,0.13,0.07,0.19,0.15,0.05,0.02,0.1,0.1,0.03,0.05,0.07,0.07,0.08,0.04,0.22,0.03,0.09,0.18,0.06,0.09,0.67,0.11,0.06,0.15,0.07,0.1,0.02,0.07,0.04,0.06,0.09,0.02,0.04,0.1,0.16,0.1,0.08,0.15,0.26],[0.14,0.14,0.24,0.24,0.23,0.16,0.21,0.78,0.29,0.52,0.25,0.3,0.19,0.25,0.11,0.17,0.44,0.26,0.04,0.16,0.37,0.21,0.72,0.25,0.26,0.33,0.44,0.55,0.06,0.31,0.28,0.22,0.3,0.24,0.24,0.39,0.21,0.28,0.29,0.2,0.18,0.24,0.31,0.33,0.22,0.28,0.2,0.12,0.32,0.22,0.17,0.25,0.23,0.12,0.14,0.16,0.3,0.25,0.23,0.19,0.2,0.23,0.58,0.27,0.15,0.19,0.17,0.12,0.06,0.18,0.51,0.29,0.24,0.31,0.56,0.07,0.18,0.3,0.39,0.12,0.36,0.26,0.28,0.15,0.19,0.41,0.23,0.24,0.08],[0.26,0.2,0.36,0.18,0.32,0.09,0.26,0.55,0.27,0.1,0.28,0.07,0.28,0.2,0.1,0.24,0.08,0.05,0.45,0.18,0.14,0.25,0.2,0.02,0.24,0.08,0.15,0.05,0.41,0.25,0.28,0.47,0.11,0.41,0.17,0.43,0.48,0.07,0.16,0.09,0.07,0.48,0.19,0.18,0.11,0.17,0.2,0.4,0.17,0.19,0.2,0.28,0.04,0.24,0.24,0.17,0.19,0.14,0.26,0.15,0.25,0.1,0.13,0.19,0.25,0.05,0.14,0.31,0.28,0.31,0.51,0.24,0.12,0.22,0.27,0.08,0.13,0.11,0.27,0.2,0.12,0.14,0.25,0.15,0.09,0.3,0.15,0.28,0.07],[0.18,0.18,0.12,0.16,0.12,0.16,0.26,0.02,0.25,0.14,0.06,0.06,0.14,0.15,0.1,0.15,0.28,0.02,0.14,0.13,0.2,0.17,0.07,0.25,0.19,0.1,0.12,0.1,0.12,0.05,0.23,0.13,0.08,0.1,0.15,0.08,0.2,0.16,0.23,0.13,0.18,0.31,0.23,0.19,0.2,0.12,0.36,0.15,0.1,0.13,0.21,0.25,0.16,0.1,0.07,0.16,0.33,0.28,0.21,0.23,0.16,0.19,0.15,0.23,0.19,0.17,0.13,0.25,0.3,0.24,0.04,0.17,0.13,0.18,0.19,0.12,0.04,0.22,0.09,0.11,0.13,0.09,0.21,0.12,0.09,0.33,0.14,0.26,0.3],[0,0,0,0,0.72,0.23,0,0,0,0,0.84,0,0,0,0,0,0,0,0,0.76,0,0,0,0,0,0.8,0,0,0,0,0.71,0,0,0,0,0,0,0,0.7,0,0.66,0,0,0,0,0,0,0,0,0.54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.68,0.27,0,0.28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.67,0,0,0.77,0,0],[0.95,0.94,0.95,0.89,0.91,0.98,0.97,0.98,0.86,0.98,0.93,0.92,0.87,0.96,0.93,0.92,0.96,0.97,0.96,0.96,0.94,0.95,0.92,0.94,0.93,0.89,0.96,0.96,0.96,0.93,0.96,0.93,0.94,0.96,0.93,0.97,0.94,0.96,0.98,0.96,0.93,0.91,0.91,0.95,0.94,0.9,0.93,0.92,0.92,0.92,0.93,0.97,0.98,0.95,0.92,0.89,0.99,0.94,0.86,0.95,0.95,0.92,0.91,0.94,0.97,0.91,0.93,0.97,0.95,0.98,0.96,0.92,0.96,0.93,0.98,0.93,0.97,0.96,0.94,0.91,0.92,0.98,0.9,0.93,0.93,0.91,0.98,0.95,0.97],[0.94,0.92,0.94,0.87,0.87,0.97,0.95,0.97,0.83,0.97,0.9,0.9,0.86,0.96,0.92,0.92,0.94,0.95,0.92,0.95,0.9,0.94,0.91,0.93,0.9,0.88,0.97,0.95,0.94,0.86,0.96,0.88,0.94,0.95,0.92,0.96,0.93,0.93,0.94,0.95,0.91,0.91,0.89,0.91,0.93,0.88,0.92,0.88,0.9,0.9,0.91,0.95,0.97,0.93,0.91,0.82,0.91,0.94,0.82,0.93,0.93,0.9,0.87,0.91,0.97,0.89,0.93,0.95,0.95,0.96,0.97,0.92,0.96,0.92,0.96,0.92,0.97,0.94,0.91,0.89,0.9,0.97,0.9,0.9,0.92,0.86,0.97,0.91,0.98],[0.03,0.02,0.01,0.01,0.02,0.02,0.02,0.02,0.03,0.02,0.02,0.02,0.03,0.02,0.03,0.07,0.03,0.02,0.04,0.02,0.01,0.02,0.02,0.03,0.06,0.02,0.03,0.03,0.02,0.04,0.02,0.05,0.02,0.02,0.02,0.08,0.03,0.01,0.05,0.03,0.04,0.03,0.02,0.02,0.03,0.07,0.03,0.02,0.01,0.01,0.02,0.01,0.04,0.01,0.01,0.05,0.03,0.03,0.02,0.03,0.02,0.01,0.01,0.02,0.01,0.02,0.04,0.05,0.04,0.02,0.11,0.12,0.02,0.01,0.03,0.01,0.01,0.03,0.01,0.01,0.01,0,0.02,0.03,0.02,0.07,0.02,0.02,0.05],[0.03,0.04,0.07,0.01,0.03,0.05,0.01,0.09,0.07,0.04,0.03,0.07,0.01,0.02,0.02,0.17,0.1,0.03,0.72,0.01,0.02,0.05,0.02,0.02,0.05,0.03,0.05,0.19,0.05,0.02,0.11,0.05,0.05,0.08,0.02,0.11,0.01,0.02,0.05,0.02,0.02,0.01,0.02,0.02,0.06,0.01,0.04,0.04,0.04,0.03,0.07,0.04,0.03,0.02,0.03,0.02,0.04,0.03,0.08,0.04,0.05,0.03,0.03,0.05,0.16,0.01,0.02,0.07,0.04,0.02,0.33,0.14,0.02,0.08,0.02,0.03,0.01,0.01,0.02,0.04,0.05,0.01,0.02,0.01,0.03,0.06,0.01,0.05,0.41],[0.13,0.16,0.14,0.13,0.03,0.06,0.07,0.18,0.21,0.15,0.04,0.1,0.06,0.21,0.04,0.2,0.24,0.09,0.77,0.15,0.06,0.1,0.17,0.17,0.15,0.08,0.14,0.18,0.14,0.17,0.17,0.1,0.09,0.21,0.09,0.3,0.27,0.17,0.16,0.06,0.09,0.16,0.34,0.06,0.06,0.05,0.1,0.18,0.06,0.08,0.4,0.16,0.05,0.1,0.07,0.04,0.02,0.04,0.18,0.16,0.33,0.08,0.09,0.17,0.16,0.11,0.06,0.12,0.13,0.12,0.24,0.2,0.1,0.12,0.06,0.13,0.09,0.08,0.12,0.07,0.13,0.16,0.09,0.31,0.01,0.21,0.07,0.23,0.08],[0.75,0.87,0.91,0.84,0.77,0.75,0.88,0.77,0.69,0.86,0.83,0.9,0.66,0.78,0.87,0.8,0.64,0.7,0.75,0.81,0.89,0.68,0.95,0.82,0.84,0.79,0.8,0.91,0.81,0.86,0.84,0.78,0.85,0.82,0.81,0.81,0.94,0.79,0.83,0.95,0.82,0.72,0.85,0.72,0.72,0.91,0.86,0.77,0.84,0.88,0.68,0.82,0.81,0.77,0.8,0.84,0.64,0.82,0.91,0.8,0.75,0.81,0.79,0.72,0.88,0.81,0.82,0.81,0.8,0.63,0.52,0.67,0.7,0.74,0.85,0.83,0.83,0.83,0.65,0.8,0.87,0.65,0.67,0.83,0.68,0.73,0.93,0.94,0.14],[0.09,0.09,0.09,0.04,0.07,0.14,0.09,0.01,0.03,0.05,0.07,0.07,0.17,0.11,0.09,0.11,0.12,0.12,0.03,0.06,0.12,0.05,0.08,0.1,0.05,0.05,0.05,0.1,0.05,0.12,0.07,0.06,0.08,0.09,0.07,0.04,0.1,0.06,0.11,0.12,0.1,0.08,0.14,0.05,0.11,0.15,0.04,0.25,0.08,0.05,0.06,0.11,0.07,0.07,0.08,0.09,0.07,0.2,0.08,0.07,0.06,0.06,0.09,0.06,0.03,0.09,0.09,0.12,0.1,0.09,0.06,0.08,0.11,0.06,0.08,0.05,0.13,0.07,0.07,0.1,0.09,0.09,0.12,0.11,0.1,0.09,0.08,0.07,0.06],[0.38,0.12,0.15,0.08,0.13,0.57,0.15,0.3,0.1,0.12,0.04,0.18,0.26,0.21,0.22,0.06,0.06,0.26,0.11,0.13,0.06,0.09,0.13,0.26,0.07,0.12,0.03,0.14,0.22,0.47,0.34,0.12,0.34,0.13,0.07,0.11,0.06,0.26,0.07,0.19,0.08,0.09,0.17,0.1,0.28,0.12,0.05,0.07,0.65,0.09,0.28,0.1,0.04,0.04,0.17,0.03,0.14,0.33,0.19,0.12,0.31,0.09,0.24,0.17,0.32,0.2,0.29,0.12,0.22,0.12,0.43,0.17,0.03,0.31,0.35,0.14,0.16,0.16,0.24,0.19,0.08,0.2,0.23,0.15,0.04,0.17,0.12,0.09,0.57],[0.93,0.98,0.98,0.98,0.92,0.96,0.98,0.99,0.97,0.97,0.96,0.94,0.95,0.94,0.98,0.96,0.98,0.99,1,0.99,0.94,0.96,0.97,0.96,0.96,0.96,0.98,0.98,0.95,0.98,0.73,0.97,0.98,0.98,0.98,0.98,0.99,0.99,0.97,0.99,0.71,0.98,0.97,0.92,0.94,0.97,0.96,0.97,0.97,0.99,0.93,0.97,0.99,0.99,0.96,0.91,0.92,0.96,0.95,0.98,0.97,0.97,0.93,0.97,0.97,0.92,0.93,0.96,0.96,0.9,0.93,0.97,0.99,0.97,0.94,0.99,0.99,1,0.98,0.95,0.98,0.99,0.94,0.96,0.95,0.95,0.96,0.99,0.97],[0.18,0.09,0.21,0.15,0.2,0.09,0.12,0.11,0.17,0.12,0.19,0.04,0.18,0.12,0.11,0.15,0.13,0.11,0.12,0.17,0.1,0.09,0.25,0.08,0.16,0.2,0.16,0.09,0.13,0.05,0.27,0.12,0.15,0.1,0.11,0.18,0.05,0.16,0.17,0.09,0.16,0.08,0.13,0.11,0.11,0.09,0.09,0.23,0.05,0.23,0.04,0.2,0.13,0.09,0.09,0.2,0.06,0.14,0.11,0.13,0.05,0.16,0.1,0.23,0.08,0.11,0.14,0.11,0.09,0.1,0.12,0.07,0.09,0.12,0.14,0.03,0.17,0.08,0.08,0.17,0.15,0.04,0.08,0.12,0.11,0.03,0.07,0.08,0.04],[0.37,0.27,0.23,0.32,0.32,0.26,0.25,0.17,0.2,0.33,0.38,0.08,0.27,0.27,0.16,0.23,0.32,0.19,0.28,0.17,0.24,0.07,0.31,0.46,0.26,0.33,0.18,0.29,0.38,0.29,0.39,0.16,0.3,0.37,0.33,0.19,0.15,0.19,0.29,0.19,0.21,0.23,0.2,0.13,0.23,0.19,0.2,0.25,0.09,0.29,0.33,0.14,0.21,0.2,0.18,0.34,0.14,0.29,0.3,0.33,0.1,0.25,0.19,0.42,0.23,0.23,0.05,0.05,0.18,0.06,0.31,0.3,0.17,0.35,0.29,0.17,0.31,0.29,0.23,0.42,0.26,0.21,0.2,0.12,0.21,0.19,0.17,0.12,0.22],[0.49,0.45,0.69,0.64,0.63,0.61,0.54,0.97,0.8,0.66,0.51,0,0.67,0.69,0.62,0.92,0.85,0.74,0.63,0.74,0.77,0.77,0.29,0.74,0.93,0.91,0.86,0.62,0.44,0.73,0.68,0.81,0.48,0.56,0.91,0.62,0.68,0.92,0.69,0.86,0.68,0.69,0.94,0.61,0.69,0.76,0.69,0.75,0.62,0.49,0.77,0.6,0.49,0.69,0.62,0.65,0.42,0.61,0.31,0.67,0.43,0.62,0.74,0.58,0.82,0.73,0.49,0.71,0.58,0.5,0.54,0.76,0.58,0.76,0.8,0.68,0.78,0.75,0.55,0.79,0.65,0.67,0.82,0.64,0.75,0.31,0.88,0.49,0],[0.02,0.03,0.06,0.02,0.02,0.05,0.02,0.17,0.14,0.07,0.06,0.13,0.05,0.05,0.05,0.1,0.05,0.07,0.26,0.09,0.02,0.05,0.04,0.03,0.03,0.09,0.13,0.16,0.1,0.05,0.04,0.04,0.12,0.05,0.02,0.1,0.17,0.03,0.17,0.06,0.04,0.01,0.05,0.03,0.03,0.04,0.06,0.11,0.09,0.03,0.17,0.06,0.06,0.04,0.04,0.08,0.13,0.04,0.06,0.04,0.06,0.04,0.06,0.04,0.08,0.04,0.07,0.05,0.13,0.12,0.68,0.06,0.01,0.2,0.17,0.03,0.01,0.04,0.04,0.07,0.08,0.06,0.15,0.09,0.02,0.07,0.03,0.06,0.12],[0.24,0.52,0.86,0.7,0.44,0.38,0.8,0.36,0.66,0.77,0.17,0.33,0.3,0.68,0.61,0.5,0.59,0.5,0.44,0.76,0.76,0.67,0.49,0.41,0.6,0.82,0.36,0.51,0.25,0.33,0.76,0.49,0.67,0.63,0.4,0.36,0.65,0.76,0.34,0.73,0.55,0.35,0.88,0.35,0.43,0.74,0.32,0.76,0.41,0.43,0.4,0.69,0.65,0.74,0.41,0.53,0.5,0.61,0.51,0.59,0.75,0.48,0.6,0.11,0.53,0.44,0.47,0.66,0.69,0.59,0.76,0.65,0.32,0.63,0.55,0.58,0.54,0.68,0.3,0.52,0.57,0.6,0.31,0.29,0.68,0.25,0.64,0.36,0.12],[0.53,0,0,0,0.72,0,0,0,0,0.27,0,0.38,0,0,0,0,0,0,0,0,0,0,0,0.6,0.38,0,0,0,0,0,0,0.62,0,0.65,0,0,0,0,0.11,0,0,0.17,0,0,0,0,0,0,0,0,0,0,0,0,0,0.46,0,0,0,0,0,0,0,0,0,0.53,0,0,0,0,0,0,0,0,0,0,0,0.43,0,0,0,0,0,0.47,0,0,0,0.83,0],[0.97,0.92,0.94,0.94,0.95,0.95,0.98,0.98,0.96,0.99,0.93,0.99,0.98,0.97,0.96,0.88,0.97,0.95,0.96,0.97,0.96,0.94,0.93,0.92,0.91,0.94,0.97,0.92,0.94,0.94,0.94,0.95,0.98,0.96,0.95,0.96,0.92,0.95,0.87,0.93,0.99,0.94,0.93,0.96,0.96,0.89,0.96,0.94,0.9,0.94,0.92,0.96,0.96,0.95,0.96,0.97,0.89,0.93,0.95,0.93,0.93,0.96,0.97,0.94,0.95,0.95,0.93,0.99,0.93,0.96,0.97,0.91,0.94,0.91,0.94,0.95,0.95,0.95,0.93,0.95,0.93,0.94,0.91,0.91,0.92,0.94,0.93,0.95,0.84],[0.03,0.04,0.06,0.01,0.01,0.04,0.03,0.05,0.02,0.04,0.01,0.05,0.02,0.02,0.01,0.1,0.02,0.02,0.05,0.01,0.01,0.03,0.02,0.03,0.06,0.03,0.04,0.06,0.03,0.04,0.02,0.02,0.03,0.03,0.01,0.05,0.03,0.01,0.05,0.01,0.02,0.01,0.02,0.02,0.03,0.03,0.03,0.01,0.03,0.02,0.01,0.04,0.02,0.01,0.02,0.02,0.03,0.02,0.05,0.02,0.02,0.03,0.02,0.02,0.07,0.01,0.03,0.04,0.01,0.03,0.08,0.02,0.02,0.05,0.04,0.02,0.01,0.01,0.01,0.02,0.05,0.02,0.03,0.03,0.03,0.06,0.01,0.03,0.13],[0,0,0,0,0,0,0,0,0,0.34,0,0,0,0,0,0,0,0,0,0,0.19,0,0,0,0,0,0,0,0,0,0,0,0.4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.07,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.18,0,0,0,0,0,0,0],[0.84,0.95,0.94,0.91,0.87,0.86,0.88,0.92,0.93,0.98,0.79,0.91,0.85,0.94,0.98,0.91,0.98,0.95,0.88,0.96,0.96,0.89,0.96,0.77,0.9,0.95,0.98,0.94,0.87,0.92,0.92,0.85,0.97,0.93,0.92,0.95,0.86,0.96,0.92,0.92,0.92,0.8,0.87,0.91,0.92,0.95,0,0.96,0.97,0.9,0.97,0.94,0.95,0.96,0.96,0.87,0.95,0.94,0.94,0.94,0.96,0.9,0.97,0.93,0.8,0.94,0.83,0.93,0.96,0.9,0.99,0.97,0.92,0.95,0.89,0.95,0.92,0.96,0.89,0.86,0.9,0.96,0.84,0.76,0.98,0.94,0.92,0.91,0.94],[0.83,0.81,0.87,0.88,0.96,0.98,0.77,0.82,0.72,0.84,0.94,0.84,0.82,0.9,0.94,0.65,0.72,0.87,0.93,0.88,0.91,0.95,0.9,0.9,0.7,0.94,0.88,0.78,0.93,0.73,0.88,0.74,0.77,0.94,0.89,0.85,0.85,0.88,0.93,0.75,0.79,0.87,0.96,0.55,0.93,0.93,0.44,0.91,0.76,0.96,0.87,0.96,0.86,0.82,0.96,0.87,0.74,0,0.92,0.88,0.77,0.66,0.87,0.54,0.84,0.88,0.86,0.92,0.93,0.85,0.93,0,0.89,0.93,0.89,0.87,0.94,0.92,0.88,0.89,0.87,0.79,0.85,0.84,0.92,0.89,0.75,0.56,0.95],[0.92,0.95,0.88,0.94,0.9,0.8,0.89,0.93,0.95,0.95,0.91,0.85,0.96,0.89,0.9,0.73,0.84,0.9,0.9,0.92,0.83,0.93,0.96,0.92,0.86,0.95,0.86,0.85,0.92,0.91,0.86,0.81,0.87,0.96,0.96,0.9,0.92,0.89,0.87,0.89,0.89,0.92,0.95,0.93,0.93,0.97,0.82,0.9,0.87,0.91,0.96,0.89,0.93,0.91,0.88,0.81,0.84,0.88,0.83,0.88,0.94,0.92,0.9,0.96,0.86,0.88,0.87,0.89,0.79,0.94,0,0.94,0.95,0.86,0.93,0.87,0.92,0.92,0.9,0.9,0.76,0.9,0.93,0.94,0.87,0.93,0.87,0.94,0.8],[0.89,0.96,0,0.93,0.9,0.71,0.9,0,0,0.9,0.94,0.8,0.97,0.86,0.92,0.46,0.8,0.9,0,0.93,0.82,0.9,0.89,0.92,0.88,0.91,0.9,0.84,0.91,0.89,0.92,0.87,0.93,0.95,0.92,0.94,0,0.87,0.76,0.89,0.84,0.88,0.95,0.94,0.93,0.92,0.86,0.92,0.91,0.89,0.96,0.85,0.93,0.94,0.9,0.7,0.95,0.89,0.8,0.85,0.94,0.94,0.91,0.99,0.79,0.88,0.88,0.93,0.86,0,0,0.95,0.92,0.91,0.89,0.82,0.92,0.88,0.89,0.88,0.76,0.87,0.92,0.92,0.83,0.89,0.89,0,0.94],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0.24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0.23,0.2,0.21,0.24,0.15,0.37,0.18,0.35,0.29,0.17,0.28,0.19,0.23,0.11,0.13,0.42,0.21,0.27,0.34,0.23,0.4,0.21,0.21,0.23,0.28,0.32,0.3,0.3,0.25,0.12,0.21,0.34,0.09,0.39,0.27,0.03,0.31,0.4,0.18,0.31,0.18,0.31,0.44,0.28,0.34,0.23,0.21,0.13,0.2,0.29,0.27,0.33,0.13,0.22,0.13,0.34,0.22,0.33,0.31,0.28,0.34,0.22,0.27,0.35,0.31,0.25,0.15,0.34,0.45,0.46,0.4,0.22,0.19,0.15,0.07,0.29,0.23,0.28,0.09,0.25,0.19,0.2,0.27,0.17,0.33,0.4,0.27,0.2,0.73],[0.16,0.05,0.19,0.1,0.08,0.13,0.14,0.36,0.17,0.09,0.05,0.23,0.1,0.12,0.15,0.06,0.08,0.08,0.05,0.14,0.11,0.16,0.07,0.08,0.12,0.05,0.18,0.22,0.06,0.04,0.14,0.08,0.1,0.11,0.05,0.2,0.1,0.13,0.1,0.08,0.1,0.03,0.03,0.07,0.03,0.11,0.04,0.19,0.04,0.11,0.05,0.12,0.08,0.07,0.05,0.09,0.02,0.09,0.17,0.1,0.02,0.13,0.11,0.08,0.07,0.04,0.03,0.03,0.13,0.07,0.05,0.23,0.06,0.12,0.13,0.08,0.04,0.03,0.07,0.09,0.03,0.11,0.04,0.12,0.04,0.04,0.1,0.1,0.38],[0.18,0.08,0.13,0.03,0.04,0.21,0.07,0.07,0.11,0.2,0.03,0.19,0.05,0.22,0.17,0.07,0.16,0.26,0.13,0.13,0.03,0.08,0.04,0.04,0.07,0.09,0.07,0.32,0.06,0.18,0.04,0.05,0.07,0.06,0.18,0.38,0.15,0.08,0.07,0.06,0.12,0.01,0.05,0.02,0.09,0.03,0.04,0.2,0.17,0.03,0.24,0.09,0.22,0.15,0.12,0.06,0.05,0.12,0.07,0.09,0.05,0.06,0.15,0.05,0.04,0.02,0.09,0.06,0.04,0.06,0.38,0.05,0.05,0.08,0.1,0.17,0.04,0.07,0.08,0.04,0.08,0.07,0.03,0.04,0.09,0.11,0.03,0.19,0.2],[0.21,0.05,0.32,0.14,0.05,0.11,0.11,0,0.15,0.18,0.05,0.59,0.23,0.14,0.66,0.24,0.42,0.27,0.49,0.41,0.13,0.21,0.34,0.09,0.09,0.15,0,0.33,0.08,0.15,0.12,0.17,0.12,0.23,0.12,0,0.17,0.34,0.35,0.36,0.35,0.04,0.08,0.08,0.06,0.12,0.1,0.66,0.25,0.06,0.27,0.3,0.47,0.36,0.12,0.41,0.06,0.14,0.13,0.26,0.49,0.13,0.19,0.16,0.24,0.04,0.06,0.11,0.15,0.18,0.07,0.1,0.09,0.25,0.09,0.17,0.18,0.27,0.09,0.02,0.1,0,0.06,0.1,0.16,0.18,0.09,0.12,0],[0.63,0.33,0.58,0.28,0.34,0.2,0.51,0.84,0.69,0.59,0.37,0.88,0.4,0.61,0.74,0.34,0.7,0.86,0.39,0.76,0.26,0.69,0.5,0.46,0.4,0.55,0.67,0.79,0.28,0.42,0.44,0.46,0.84,0.37,0.84,0.54,0.76,0.71,0.55,0.78,0.42,0.27,0.67,0.38,0.57,0.28,0.57,0.69,0.61,0.41,0.42,0.5,0.73,0.71,0.49,0.64,0.67,0.54,0.37,0.53,0.56,0.65,0.75,0.52,0.34,0.32,0.19,0.32,0.4,0.58,0.26,0.23,0.91,0.43,0.41,0.67,0.76,0.62,0.56,0.46,0.27,0.82,0.24,0.15,0.5,0.36,0.4,0.37,0.85],[0.3,0.07,0.16,0.03,0.1,0.11,0.06,0.12,0.17,0.34,0.06,0.29,0.05,0.39,0.29,0.04,0.28,0.16,0.43,0.54,0.04,0.24,0.12,0.09,0.04,0.22,0.33,0.18,0.07,0.09,0.2,0.06,0.35,0.18,0.2,0.3,0.19,0.2,0.15,0.13,0.07,0.06,0.07,0.07,0.14,0.03,0.05,0.2,0.16,0.12,0.13,0.29,0.24,0.23,0.2,0.14,0.17,0.3,0.09,0.26,0.16,0.3,0.46,0.2,0.21,0.04,0.14,0.07,0.11,0.02,0.04,0.05,0.08,0.21,0.13,0.28,0.16,0.08,0.12,0.13,0.03,0.63,0.17,0.11,0.05,0.22,0.12,0.31,0],[0,0,0.01,0,0,0.01,0,0.01,0.01,0.01,0.01,0.01,0.02,0,0.01,0.02,0,0,0.02,0.01,0,0.01,0.01,0,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0,0.02,0,0,0.01,0,0.01,0.01,0.01,0.01,0,0.01,0.01,0,0.01,0,0,0.01,0,0.01,0.01,0,0.01,0.01,0.01,0,0,0,0.01,0,0.01,0.01,0.01,0,0.01,0.01,0.03,0.01,0,0,0.02,0,0.01,0,0.01,0,0.01,0.01,0.01,0.01,0,0.01,0,0.01,0.02],[0.98,0.99,0.99,0.99,0.98,1,0.98,0.99,0.99,0.98,0.94,0.99,0.99,0.98,0.99,0.98,0.99,0.98,0.97,0.98,1,0.99,0.99,0.99,0.97,0.98,0.98,0.98,0.98,0.99,0.99,0.98,0.99,1,0.98,0.99,0.96,0.98,0.99,1,0.99,0.99,0.96,0.99,0.98,0.99,0.99,0.96,0.98,0.99,0.99,0.99,0.99,0.99,0.98,0.98,0.99,0.99,0.99,1,0.99,0.98,0.99,0.98,0.99,0.99,0.99,0.99,0.98,0.99,0.97,0.98,0.99,1,0.97,1,0.98,0.99,0.99,0.99,0.99,0.98,1,0.99,0.99,0.99,0.99,1,0.99],[0,0.01,0.02,0.01,0.01,0.01,0.01,0,0.01,0,0.01,0,0.01,0,0.01,0.01,0.02,0,0.01,0,0,0,0.01,0,0,0.01,0.01,0,0.01,0.01,0,0.01,0.01,0.01,0,0.03,0,0,0.01,0,0.01,0.01,0.01,0,0.01,0.01,0.01,0.01,0.01,0.01,0,0,0,0,0.01,0,0.01,0.01,0.01,0,0,0.01,0,0,0.02,0,0.01,0,0.02,0.02,0.01,0,0.01,0,0,0,0.01,0.01,0.01,0,0,0.01,0,0.02,0,0.02,0.01,0.01,0.01],[0.07,0.04,0.03,0.02,0.02,0.05,0.06,0.02,0.05,0.04,0.02,0.07,0.03,0.02,0.01,0.04,0.04,0.05,0.05,0.03,0.03,0.04,0.03,0.05,0.05,0.03,0.03,0.03,0.04,0.03,0.02,0.03,0.04,0.01,0.03,0.03,0.06,0.01,0.01,0.05,0.03,0.06,0.02,0.05,0.1,0.03,0.03,0.03,0.02,0.02,0.03,0.02,0.01,0.01,0.04,0.01,0.04,0.03,0.02,0.04,0.04,0.07,0.03,0.04,0.02,0.02,0.03,0.03,0.03,0.04,0.02,0.04,0.04,0.01,0.12,0.03,0.06,0.01,0.03,0.03,0.01,0.02,0.03,0.07,0.04,0.03,0.01,0.02,0.17],[0.11,0.05,0.16,0.06,0.04,0.03,0.01,0.29,0.44,0.09,0.06,0.16,0.1,0.11,0.03,0.38,0.11,0.06,0.29,0.16,0.05,0.06,0.24,0.09,0.08,0.09,0.19,0.07,0.08,0.14,0.26,0.1,0.08,0.18,0.08,0.16,0.15,0.09,0.18,0.06,0.09,0.11,0.04,0.18,0.18,0.1,0,0.42,0.18,0.13,0.25,0.09,0.28,0.35,0.03,0.14,0.22,0.26,0.03,0.13,0.24,0.32,0.22,0.48,0.23,0.14,0.09,0.04,0.09,0.18,0.67,0.29,0.09,0.2,0.14,0.08,0.09,0.23,0.27,0.17,0.39,0.45,0.12,0.09,0.27,0.09,0.14,0.09,0.03],[0,0,0,0.84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.73,0,0,0,0,0,0,0,0,0,0,0,0]]}}
                ).then(function(v){ 
                    var svg = v.documentElement;
                    // svg.attributes['width'] = '100%';
                    // svg.attributes['height'] = '100%';
                    var elSvg = $(svg);
                    elSvg.css("width","100%").css("height","100%")
                    elChart.append(svg);

                    var osLayout = osApi.getLayout();
                elChart.css("margin-left", (osLayout.left) + "px");
                elChart.css("width", ($window.innerWidth - osLayout.left - osLayout.right) + "px");
                elChart.css("height", ($window.innerHeight - 170) + "px");
                    
                });
            });

        }
    }
})();
