(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osCohortService', osCohortService);

    /** @ngInject */
    function osCohortService(osApi, moment, signals, osSound, _) {

        var onMessage = new signals.Signal();
        var onPatientsSelect = new signals.Signal();
        var onGenesSelect    = new signals.Signal();

        var worker = new Worker("app/components/oncoscape/oncoscape.cohort.service.worker.js");
        worker.addEventListener('message', function(msg) { onMessage.dispatch(msg);}, false);

        var allGeneCohorts = [],
            activePatientCohort,
            activeGeneCohort;

        var allPatientCohorts = localStorage.getItem(osApi.getDataSource().disease+"PatientCohorts");
        allPatientCohorts = (allPatientCohorts==null) ? [] : JSON.parse(allPatientCohorts);

        var getSurvivalData = function(cohorts){

            worker.postMessage({
                cmd: "getSurvivalData",
                data: cohorts
            });

        }

        var getPatientMetric = function(){
            if (!activePatientCohort.ids) return;
              worker.postMessage({
                cmd: "getPatientMetric",
                data: activePatientCohort.ids
            });
        };
        var getPatientCohorts = function(){ return allPatientCohorts;  };
        var getPatientCohort = function(){ return activePatientCohort; };
        var addPatientCohort = function(disease){ 
            
                if (allPatientCohorts.indexOf(activePatientCohort)!=-1) return;
                allPatientCohorts.push(activePatientCohort); 
                localStorage.setItem(osApi.getDataSource().disease+"PatientCohorts", JSON.stringify(allPatientCohorts));

            };
        var delPatientCohort = function(obj){ 
                allPatientCohorts.splice(allPatientCohorts.indexOf(obj),1); 
                localStorage.setItem(osApi.getDataSource().disease+"PatientCohorts", JSON.stringify(allPatientCohorts));
            };


        var setPatientCohort = function(ids, name){
            function S4() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
 
            activePatientCohort = (!Array.isArray(ids)) ? ids : {
                id: (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase(),
                ids: ids,
                name: name,
                time: new Date()
            };
            onPatientsSelect.dispatch(activePatientCohort);
        };

        // var filterPatientCohort = function(){


        // };

        var getGeneMetric = function(obj){
            console.log(obj);
        };
        var getGeneCohorts = function(){ return allGeneCohorts;  };
        var getGeneCohort = function(){ return activeGeneCohort; };
        var addGeneCohort = function(){ allGeneCohorts.push(activeGeneCohort); };
        var delGeneCohort = function(obj){ allGeneCohorts.splice(allGeneCohorts.indexOf(obj),1); };
        var setGeneCohort = function(ids, name){
            function S4() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
            activeGeneCohort = (!Array.isArray(ids)) ? ids : {
                id: (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase(),
                ids: ids,
                name: name,
                time: new Date()
            };
            onGenesSelect.dispatch(activeGeneCohort);
        };

        var api = {
            onMessage: onMessage,
            onPatientsSelect: onPatientsSelect,
            getPatientCohorts: getPatientCohorts,
            getPatientCohort: getPatientCohort,
            setPatientCohort: setPatientCohort,
            addPatientCohort: addPatientCohort,
            delPatientCohort: delPatientCohort,
            getPatientMetric: getPatientMetric,
            onGenesSelect: onGenesSelect,
            getGeneCohorts: getGeneCohorts,
            getGeneCohort: getGeneCohort,
            setGeneCohort: setGeneCohort,
            addGeneCohort: addGeneCohort,
            delGeneCohort: delGeneCohort,
            getGeneMetric: getGeneMetric,
            getSurvivalData: getSurvivalData
        };

        return api;
    }
})();