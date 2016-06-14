(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osMarkers', markers);

    /** @ngInject */
    function markers() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/markers/markers.html',
            scope: {},
            controller: MarkersController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function MarkersController(osApi, osHistory, $state, $timeout, $scope, $stateParams, cytoscape, signals, moment, $window, _, $q) {



            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // Elements
            var cyChart;
            var elChart = angular.element(".markers-chart");

            // Initialize View Model
            var vm = initializeViewModel(this, $stateParams);


            vm.resize = function(){
                var width = $window.innerWidth;
                if (angular.element(".tray").attr("locked")=="true") width -= 300;
                elChart.width( width );
                elChart.height($window.innerHeight - 90);
                if (cyChart) cyChart.resize();
            }

            // Window Listeners // Todo: Need To Remove On $destroy
            angular.element($window).bind('resize', 
                _.debounce(vm.resize, 300)
            );
            angular.element($window).bind('click', 
                function(){
                    $scope.$apply(function(){
                        vm.optCtxGeneShow = false;
                        vm.optCtxPatientShow = false;
                    });
                }
            );
       
            // Load Data
            osApi.setBusy(true);
            loadData(osApi, vm, $q, function(data){

                // Resize
                vm.resize();

                // Initalize Styles
                var styles = initializeStyles();

                // Initialize Chart
                cyChart = initializeChart(data, styles, cytoscape, angular.element("#markers-chart"));

                // Load Gene Sets
                $scope.$watch("vm.optGeneSet", function(){
                    loadGeneSet(osApi, vm, $q, cyChart);
                });

                // Initialize Layouts
                initializeLayouts(cyChart, vm, $scope);

                // Initialize Node Colors
                initializeNodeColors(cyChart, vm, $scope, osApi, $timeout, _);

                // Initialize Edge Colors
                initializeEdgeColors(cyChart, vm, $scope, $timeout);

                // Initialize Events
                initializeEvents(cyChart, vm, $scope, $timeout, osApi, signals);

                // Initalize Search
                initializeSearch(cyChart, vm, $scope)

                // Initialize Zoom
                initializeZoom(cyChart, _);

                // Initialize Commands
                initializeCommands(cyChart, vm, $window);

                // Initialize History
                initializeHistory(cyChart, osHistory, _, $scope);
                
                // Ready
                osApi.setBusy(false);
            });
        }

        function initializeSearch(chart, vm, $scope){

            // Search Gene Textbox
            $scope.$watch("vm.searchGene", function(){
                if (angular.isUndefined(vm.searchGene)){
                    vm.geneSearchResult = "";
                    return;
                } 
                chart.startBatch();
                var matches = {found:0};
                chart.nodes('node[nodeType="gene"]')
                    .forEach(function(ele){
                        if (vm.searchGene=="") { ele.deselect(); return; }
                        if (ele.data().name.toLowerCase().indexOf(vm.searchGene.toLowerCase())==0){
                            ele.select(); 
                            this.found += 1;
                        }else{
                            ele.deselect();
                        }
                    }, matches);
                chart.endBatch();
                if (vm.searchGene=="") vm.searchGeneResult = "";
                else vm.searchGeneResult = "("+matches.found +" Matches)"
            });

            // Search Patient Textbox
            $scope.$watch("vm.searchPatient", function(){
                if (angular.isUndefined(vm.searchPatient)) return;
                chart.startBatch();
                var matches = {found:0};
                chart.nodes('node[nodeType="patient"]')
                    .forEach(function(ele){
                        if (vm.searchPatient=="") { ele.deselect(); return; }
                        if (ele.data().id.toLowerCase().indexOf(vm.searchPatient.toLowerCase())==0){
                            ele.select()
                            this.found += 1;
                        }else{
                            ele.deselect();
                        }
                }, matches);
                chart.endBatch();
                if (vm.searchPatient=="") vm.searchPatientResult = "";
                else vm.searchPatientResult = "("+matches.found +" Matches)"
            });
        }          
        function initializeCommands(chart, vm, $window){
            vm.optInteractiveMode = vm.optInteractiveModes[0];
            vm.optCommandPatient = [
                {name:"Show Edges", cmd:function(){
                    vm.optCommandPatient.selected.select();
                    var degmap = {};
                    vm.optCommandPatient.selected
                        .neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'element'};
                        }, degmap);
                    chart.batchData(degmap);
                }},
                {name:"Hide Edges", cmd:function(){
                    var degmap = {};
                    vm.optCommandPatient.selected
                        .neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'none'};
                        }, degmap);
                    chart.batchData(degmap);
                }},
                {name:"Select Associated Genes", cmd:function(){
                    chart.startBatch();
                    vm.optCommandPatient.selected.select();
                    vm.optCommandPatient.selected
                        .neighborhood('node')
                        .forEach( function(ele){
                            ele.select();
                        });
                    chart.endBatch();
                    vm.optCtxPatientShow = false;
                }},
                {name:"Deselect Associated Genes", cmd:function(){
                    chart.startBatch();
                    vm.optCommandPatient.selected
                        .neighborhood('node')
                        .forEach( function(ele){
                            ele.deselect();
                        });
                    chart.endBatch();
                    vm.optCtxPatientShow = false;
                }},
                {name:"View Oncoprint", cmd:function(){

                    if (vm.datasource=="DEMOdz") return;
                    if (vm.datasource.indexOf("TCGA" == 0)) {
                        var cbioDsName = vm.datasource.substr(4) + "_tcga";
                        var genes = vm.optCommandPatient.selected.neighborhood('node').map(function(n) {
                            return n.data().name;
                        }).join("+");
                        var url = "http://www.cbioportal.org/ln?cancer_study_id=" + cbioDsName + "&q=" + genes;
                        $window.open(url);
                    }
                    vm.optCtxPatientShow = false;
                }}
            ];
            vm.optCommandGene = [
                {name:"Show Edges", cmd:function(){
                    vm.optCommandGene.selected.select();
                    
                    var degmap = {};
                    vm.optCommandGene.selected
                        .neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'element'};
                        }, degmap);
                    chart.batchData(degmap);
                }},
                {name:"Hide Edges", cmd:function(){
                    var degmap = {};
                    vm.optCommandGene.selected
                        .neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'none'};
                        }, degmap);
                    chart.batchData(degmap);
                }},
                {name:"Select Associated Patients", cmd:function(){
                    chart.startBatch();
                    vm.optCommandGene.selected.select();
                    vm.optCommandGene.selected
                        .neighborhood('node')
                        .forEach( function(ele){
                            ele.select();
                        });
                    chart.endBatch();
                    vm.optCtxGeneShow = false;
                }},
                {name:"Deselect Associated Patients", cmd:function(){
                    chart.startBatch();
                    vm.optCommandGene.selected
                        .neighborhood('node')
                        .forEach( function(ele){
                            ele.deselect();
                        });
                    chart.endBatch();
                    vm.optCtxPatientShow = false;
                }},
                {name:"View Gene Card", cmd:function(){
                    $window.open("http://www.genecards.org/cgi-bin/carddisp.pl?gene="+vm.optCommandGene.selected.data().name);
                    vm.optCtxGeneShow = false;
                }}
            ];
            vm.optCommands = {
                 "zoomReset" : function(){
                    chart.fit();
                    chart.center();
                },
                "zoomFit" : function(){
                    chart.fit( chart.$(':selected'), 50 )
                },
                "showPatientsInCommon": function(){
                    var geneNodes = chart.$('node[nodeType="gene"]:selected');
                    var geneNames = geneNodes.map(function(item){ return item.data().name; });
                    var patientNodes = geneNodes.neighborhood("node");

                    chart.startBatch();
                    patientNodes.filter(function(i, patient){
                        var patientGeneNames = patient.neighborhood("node").map(function(item){ return item.data().name; })
                        geneNames.forEach(function(geneName){
                            if (patientGeneNames.indexOf(geneName)==-1) return false;
                        })
                        return true;
                    }).forEach( function(ele){
                        ele.select();
                    });
                    chart.endBatch();
                },
                "showGenesInCommon": function(){
                    var patientNodes = chart.$('node[nodeType="patient"]:selected');
                    var genes;

                    patientNodes.each(function(i, ele){
                        var patientGenes = ele.neighborhood("node").map( function(item){ return item.data().name; });
                        if (i==0) genes = patientGenes;
                        else{
                            genes = genes.filter(function(gene){
                                return patientGenes.indexOf(gene)>=0;
                            }, patientGenes)
                        }
                    })
                    chart.startBatch();
                    chart.$('node[nodeType="gene"]')
                        .forEach(function(node){
                            if (genes.indexOf(node.data().name)>=0){
                                node.select();
                            }
                        });
                    chart.endBatch();

                },
                "showPatientEdges": function(){
                    var degmap = {};
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach(function(node){
                            node.neighborhood('edge').forEach(function(item){
                                this[item.id()] = {display:'element'};
                            }, this);
                    }, degmap);
                    chart.batchData(degmap);
                },
                "hidePatientEdges": function(){
                    var degmap = {};
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach(function(node){
                            node.neighborhood('edge').forEach(function(item){
                                this[item.id()] = {display:'none'};
                            }, this);
                    }, degmap);
                    chart.batchData(degmap);
                },
                "showGeneEdges": function(){
                    var degmap = {};
                    chart.$('node[nodeType="gene"]:selected')
                        .forEach(function(node){
                            node.neighborhood('edge').forEach(function(item){
                                this[item.id()] = {display:'element'};
                            }, this);
                    }, degmap);
                    chart.batchData(degmap);
                },
                "hideGeneEdges": function(){
                    var degmap = {};
                    chart.$('node[nodeType="gene"]:selected')
                        .forEach(function(node){
                            node.neighborhood('edge').forEach(function(item){
                                this[item.id()] = {display:'none'};
                            }, this);
                    }, degmap);
                    chart.batchData(degmap);
                },
                "selectConnectedGenes" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="patient"]:selected')
                        .neighborhood('node')
                        .forEach( function(ele){
                            ele.select();
                        });
                    chart.endBatch();
                },
                "selectConnectedPatients" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="gene"]:selected')
                        .neighborhood('node')
                        .forEach( function(ele){
                            ele.select();
                        });
                    chart.endBatch();
                },
                "selectPatients" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="patient"]')
                        .forEach( function(ele){
                            ele.select();
                        });
                    chart.endBatch();
                },
                "selectGenes" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="gene"]')
                        .forEach( function(ele){
                            ele.select();
                        });
                    chart.endBatch();
                },
                "deselectPatients" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach( function(ele){
                            ele.deselect();
                        });
                    chart.endBatch();
                },
                "deselectGenes" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="gene"]:selected')
                        .forEach( function(ele){
                            ele.deselect();
                        });
                    chart.endBatch();
                },
                "invertPatientSelection" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="patient"]')
                        .forEach( function(ele){
                            ele[ele._private.selected?"deselect":"select"]();
                        });
                    chart.endBatch();
                },
                "invertGeneSelection" : function(){
                    chart.startBatch();
                    chart.$('node[nodeType="gene"]')
                        .forEach( function(ele){
                            ele[ele._private.selected?"deselect":"select"]();
                        });
                    chart.endBatch();
                },
                "invertAll": function(){
                    chart.startBatch();
                    chart.$('node[nodeType="patient"]')
                        .forEach( function(ele){
                            ele[ele._private.selected?"deselect":"select"]();
                        });
                    chart.$('node[nodeType="gene"]')
                        .forEach( function(ele){
                            ele[ele._private.selected?"deselect":"select"]();
                        });
                    chart.endBatch();
                },
                "deselectAll" : function(){
                    chart.startBatch();
                    chart.$('node:selected')
                        .forEach( function(ele){
                            ele.deselect();
                        });
                    chart.endBatch();
                },
                "hideAllEdges" : function(){
                    var degmap = {};
                    chart.$('edge[edgeType!="chromosome"]').forEach(function(item){
                        this[item.id()] = {display:'none'};
                    }, degmap);
                    chart.batchData(degmap);
                }
            };
        }
        function initializeViewModel(vm, $stateParams){

            vm.datasource = $stateParams.datasource;
            vm.optCommandGene = false;
            vm.optCtxGeneShow;
            vm.optCommandPatient;
            vm.optCtxPatientShow = false;
            vm.optInteractiveModes;
            vm.optInteractiveMode;
            vm.optPatientLayouts;
            vm.optPatientLayout;
            vm.optNodeColors;
            vm.optNodeColor;
            vm.optEdgeColors;
            vm.legandNodes;
            vm.legandPatient;
            vm.legandChromosomes;
            vm.searchGene;
            vm.searchGeneResult = "";
            vm.searchPatient;
            vm.searchPatientResult = "";
            vm.optGeneSets;
            vm.optGeneSet = "";
            vm.optCohortModes;
            vm.optCohortMode = "";
            vm.optCohortPatients;
            vm.optCohortPatient;
            vm.optCohortGenes;
            vm.optCohortGene;
            vm.optCommands;
            vm.patient;
            vm.gene;
            vm.frame;
            return vm;
        }

        function initializeHistory(chart, osHistory, _, $scope){

            // History Integration
            var selectedGeneIds = (osHistory.getGeneSelection() == null) ? [] : osHistory.getGeneSelection().ids;
            var selectedPatientIds = (osHistory.getPatientSelection() == null) ? [] : osHistory.getPatientSelection().ids;

            function saveSelectedGenes(){
                var ids = chart.$('node[nodeType="gene"]:selected').map(function(ele){ return ele.data().id.toUpperCase() });
                if (_.difference(ids, selectedGeneIds).length==0) return;
                if(ids.length>0) osHistory.addGeneSelection("Markers + Patients", "Manual", ids);
            }

            function saveSelectedPatients(){
                var ids = chart.$('node[nodeType="patient"]:selected').map(function(ele){ return ele.data().id.toUpperCase() });
                if (_.difference(ids, selectedPatientIds).length==0) return;
                if(ids.length>0) osHistory.addPatientSelection("Markers + Patients", "Manual", ids);
            }

            chart.on('select', 'node[nodeType="gene"]', _.debounce(saveSelectedGenes, 900));
            chart.on('select', 'node[nodeType="patient"]', _.debounce(saveSelectedPatients, 900));

            function setSelectedGenes(){
                var degmap = [];
                chart.startBatch();
                if (selectedGeneIds.length==0){
                    chart.$('node[nodeType="gene"]:selected')
                            .forEach( function(ele){
                                ele.deselect();
                                degmap[ele.id()] = {display:'element'};
                            }, degmap);
                }else{
                    chart.$('node[nodeType="gene"]')
                        .forEach( function(ele){
                            ele[ (this.indexOf(ele.id())==-1) ? "deselect" : "select"]();
                        }, selectedGeneIds);
                }
                chart.batchData(degmap);
                chart.endBatch();
            }
            function setSelectedPatients(){
                var degmap = [];
                chart.startBatch();
                if (selectedPatientIds.length==0){
                    chart.$('node[nodeType="patient"]:selected')
                            .forEach( function(ele){
                                ele.deselect();
                                degmap[ele.id()] = {display:'element'};
                            }, degmap);
                }else{
                    chart.$('node[nodeType="patient"]')
                        .forEach( function(ele){
                            ele[ (this.indexOf(ele.id())==-1) ? "deselect" : "select"]();
                        }, selectedPatientIds);
                }
                chart.batchData(degmap);
                chart.endBatch();
            }
            setSelectedGenes();
            setSelectedPatients();

            osHistory.onGeneSelectionChange.add(function(selection){
                selectedGeneIds = (selection==null) ? null : selection.ids;
                setSelectedGenes();
            });
            osHistory.onPatientSelectionChange.add(function(selection){
                selectedPatientIds = (selection==null) ? null : selection.ids;
                setSelectedPatients();
            });

            
            




            $scope.$on("$destroy", function() {
                saveSelectedGenes();
                saveSelectedPatients();
                osHistory.removeListeners();
            });

            return {
                saveGenes: saveSelectedGenes,
                savePatients: saveSelectedPatients
            };
        }

        function initializeChart(data, styles, cytoscape, el){
            // Initalize Cytoscape Chart
            // If performance becomes an issue set *Viewport attributes to true
            return cytoscape({
                container: el,
                elements: data,
                style: styles,
                hideEdgesOnViewport: false,
                hideLabelsOnViewport: true,
                textureOnViewport: false,
                motionBlur: false,
                 //motionBlurOpacity: 0.2,
                //minZoom: .05,
                //maxZoom: 40,
                layout: {
                    name: "preset",
                    fit: true
                }
            });
        }

        function initializeStyles(){
            // Unlike CSS order of operations is determined by order
            // Play specific attention to use of data() + mapdata() values they are dynamic
            // Care should be taken not to update styles directly in code, but to use underlying data model
            // Cytoscape Dynamic Style Properties Include
            /*
                display
                color
                sizeEle
                sizeLbl
                posX
                posY
                hobo
                patient
            */
            return [
            {
                selector: 'core',
                style:{
                    'selection-box-color': '#3993fa',
                    'selection-box-border-color': '#3993fa',
                    'selection-box-border-width': '1px',
                    'selection-box-opacity': '.2'
                }
            },
            {
                selector: 'node',
                style: {
                    'display': "data(display)",
                    'height': "mapData(sizeEle, 0, 50, 10, 100)",
                    'width': "mapData(sizeEle, 0, 50, 10, 100)",
                    'font-size': 'data(sizeLbl)',
                    'text-valign': 'center'
                }
            }, {
                selector: 'node[nodeType="patient"]',
                style: {
                    'background-color': 'data(color)',
                    'text-halign': 'center',
                    'border-width': 500,
                    'width': '2500px',
                    'height': '2500px',
                    'border-color': '#FFFFFF'
                }
            }, {
                selector: 'node[nodeType="patient"]:selected',
                style: {
                    'border-color': "#FF0000",
                    'border-width': 10
                }
            }, {
                selector: 'node[nodeType="gene"]',
                style: {
                    'background-color': "#FFFFFF",
                    'border-color': "#38347b",
                    'text-halign': "right",
                    //'label': "data(id)",
                    'border-width': 'data(sizeBdr)',
                    'width': '2500px',
                    'height': '2500px'
                }
            }, {
                selector: 'node[nodeType="gene"]:selected',
                style: {
                    'border-color': "#FF0000",
                    'border-width': 10
                }
            },{
                selector: 'node[nodeType="centromere"]',
                style:{
                    'font-size': '2000px',
                    'text-halign': 'center',
                    'background-color': "#3993fa",
                    'color':"#FFFFFF",
                    'border-color': 'rgb(19, 150, 222)',
                    'height': '2500px',
                    'width': '4000px',
                    'shape': 'roundrectangle',
                    'label': "  data(id)"
                }
            },{
                selector: 'edge',
                style:{
                    'display': "data(display)",
                    'line-color': "data(color)",
                    'width': "data(sizeEle)"
                }
            }];
        }

        function initializeEvents(chart, vm, $scope, $timeout, osApi, signals){

            // Create Signals
            var events = (function(signals) {
                var geneOver = new signals.Signal();
                var geneOut = new signals.Signal();
                var geneClick = new signals.Signal();
                var geneCtx = new signals.Signal();
                var patientOver = new signals.Signal();
                var patientOut = new signals.Signal();
                var patientClick = new signals.Signal();
                var patientCtx = new signals.Signal();
                var removeAll = function() {
                    geneOver.removeAll();
                    geneOut.removeAll();
                    geneClick.removeAll();
                    geneCtx.removeAll();
                    patientOver.removeAll();
                    patientOut.removeAll();
                    patientClick.removeAll();
                    patientCtx.removeAll();
                }
                var over = function(e) {
                    geneOver.add(e);
                    patientOver.add(e);
                };
                var out = function(e) {
                    geneOut.add(e);
                    patientOut.add(e);
                }
                var click = function(e) {
                    geneClick.add(e);
                    patientClick.add(e);
                }
                return {
                    geneOver: geneOver,
                    geneOut: geneOut,
                    geneClick: geneClick,
                    geneCtx: geneCtx,
                    patientOver: patientOver,
                    patientOut: patientOut,
                    patientClick: patientClick,
                    patientCtx: patientCtx,
                    over: over,
                    out: out,
                    click: click,
                    removeAll: removeAll
                };
            })(signals);

            // Attach Event Signals To Real Events
            chart
                .on('click', 'node[nodeType="gene"]', events.geneClick.dispatch)
                .on('click', 'node[nodeType="patient"]', events.patientClick.dispatch)
                .on('mouseover', 'node[nodeType="gene"]', events.geneOver.dispatch)
                .on('mouseover', 'node[nodeType="patient"]', events.patientOver.dispatch)
                .on('mouseout', 'node[nodeType="gene"]', events.geneOut.dispatch)
                .on('mouseout', 'node[nodeType="patient"]', events.patientOut.dispatch)
                .on('cxttap', 'node[nodeType="gene"]', events.geneCtx.dispatch )
                .on('cxttap', 'node[nodeType="patient"]', events.patientCtx.dispatch );
                

            // Cache Hide All Edges Structure
            var hidePatientEdges = {};
            chart.$('edge[edgeType!="chromosome"]')
                .forEach(function(node){ this[node.id()] = { display: 'none' };}, hidePatientEdges);
                    
            // Define Behaviors
            var behaviors = {
                showGeneCtxMenu: function(e){
                    vm.optCommandGene.selected = e.cyTarget;
                    var oe = e.originalEvent;
                    var elMenu = angular.element("#gene-ctx-menu");
                    elMenu.show();
                    $scope.$apply(function(){
                        vm.optCtxGeneShow = true;
                    });
                    elMenu.css({left: oe.pageX-20, top: oe.pageY-20});
                    elMenu.find(".title").text(vm.optCommandGene.selected.data().name);
                    return this;
                },
                showPatientCtxMenu: function(e){
                    vm.optCommandPatient.selected = e.cyTarget;
                    var oe = e.originalEvent;
                    var elMenu = angular.element("#patient-ctx-menu");
                    elMenu.show();
                    $scope.$apply(function(){
                        vm.optCtxPatientShow = true;
                    });
                    elMenu.css({left: oe.pageX-20, top: oe.pageY-20});
                    elMenu.find(".title").text(vm.optCommandPatient.selected.data().name);
                    return this;
                },
                showPatientInfo: function(e){
                    if (e.cyTarget.data().nodeType == 'patient') {
                        vm.patient = e.cyTarget.attr('patient');
                        vm.patientChromosomes = e.cyTarget.neighborhood("node")
                            .map(function(item) { return item.data().id });
                        $scope.$apply();
                    }else{
                        var gene = {
                            name: e.cyTarget.data().name,
                            mutation: e.cyTarget.neighbourhood("edge[edgeType='mutation']").length,
                            cnl1: e.cyTarget.neighbourhood("edge[edgeType='cnLoss.1']").length,
                            cnl2: e.cyTarget.neighbourhood("edge[edgeType='cnLoss.2']").length,
                            cng1: e.cyTarget.neighbourhood("edge[edgeType='cnGain.1']").length,
                            cng2: e.cyTarget.neighbourhood("edge[edgeType='cnGain.2']").length
                        }
                        gene.mutations = gene.cnl1 + gene.cnl2 + gene.cng1 + gene.cng2;
                        vm.gene = gene;
                        $scope.$apply();
                    }
                    return this;
                },
                hidePatientInfo: function(){
                    $scope.$apply(function() {
                        vm.gene = vm.patient = vm.patientChromosomes = null;
                    });
                    return this;
                },
                showDegreeOne: function(e){
                    var degmap = {};
                    var target = (e.cyTarget.data().nodeType == 'patient') ? 'target' : 'source';

                    chart.startBatch();
                    e.cyTarget.neighborhood('edge')
                        .forEach(function(item){
                            this.degmap[item.id()] = {display:'element'};
                            item[this.target]().css({
                                'background-color':item.data().color,
                                'border-color': item.data().color,
                                'border-width': 60,
                                'border-opacity': .3
                            });
                        }, {degmap:degmap, target:target});
                    chart.endBatch();
                    chart.batchData(degmap);
                },
                hideDegreeOne: function(e){
                    var degmap = {};
                    var target = (e.cyTarget.data().nodeType == 'patient') ? 'target' : 'source';
                    var css = { 
                        'background-color': "",
                        'border-color': "",
                        'border-width': "",
                        'border-opacity': ""
                    }
                    chart.startBatch();
                    e.cyTarget.neighborhood('edge')
                        .forEach(function(item){
                            this.degmap[item.id()] = {display:'none'};
                            item[target]().style(this.css);
                        }, {degmap:degmap, css:css, target:target});
                    chart.endBatch();                        
                    chart.batchData(degmap);
                },
                showDegreeTwo: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('node')
                        .forEach(function(node){
                            node.neighborhood('edge')
                                .forEach(function(item){
                                    this[item.id()] = {display:'element'};
                            }, this);
                        }, degmap);
                    chart.batchData(degmap);
                },
                hideDegreeTwo: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('node')
                        .forEach(function(node){
                            node.neighborhood('edge')
                                .forEach(function(item){
                                    this[item.id()] = {display:'none'};
                            }, this);
                        }, degmap);
                    chart.batchData(degmap);
                }
            }

            // Use States To Associate Events + Behaviors
            var states = [
            {
                name: 'Commands', //1° When 
                register: function(){
                    events.geneCtx.add(behaviors.showGeneCtxMenu);
                    events.patientCtx.add(behaviors.showPatientCtxMenu);
                    events.over(function(e) {
                        behaviors.showPatientInfo(e)
                    });
                    events.out(function(e) {
                        behaviors.hidePatientInfo(e);
                    });
                },
                unregister: function(){

                    // Hide All Edges
                    events.removeAll();
                    chart.batchData(hidePatientEdges);
                }

            },
            {
                name: 'Selection Highlight', //1° When 
                register: function(){
                    var degmap = {};
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach(function(node) {
                            node.neighborhood('edge').forEach( function(edge) {
                                this[edge.id()] = { display: 'element' };
                            }, degmap)
                        }, degmap);
                    chart.batchData(degmap);
                    chart.on('select', 'node', {ui:true}, function(e){
                        behaviors.showDegreeOne(e);
                    });
                    chart.on('unselect','node',{ui:true}, function(e){
                        behaviors.hideDegreeOne(e);
                    });
                    events.over(function(e) {
                        behaviors.showPatientInfo(e)
                    });
                    events.out(function(e) {
                        behaviors.hidePatientInfo(e);
                    });

                },
                unregister: function(){

                    // Hide All Edges
                    chart.batchData(hidePatientEdges);
                    chart.off('select', 'node');
                    chart.off('unselect', 'node');
                }

            },
            {
                name: 'Roll Over Highlight', //1° On 
                register: function() {
                    // events.click(function(e) {
                    //     behaviors
                    //         .showOncoPrint(e)
                    // });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                            .showDegreeOne(e)
                        
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                            .hideDegreeOne(e)
                    });
                },
                unregister: function() {
                    events.removeAll();
                }
            }
          ];

            vm.optInteractiveModes = states;
            vm.optInteractiveMode = vm.optInteractiveModes[0];

            // What Scope To Initialize Behaviors
            $scope.$watch("vm.optInteractiveMode", function(next, prev) {
                if (angular.isDefined(prev)) prev.unregister();
                if (angular.isDefined(next)) next.register();
            });
        }

        function initializeEdgeColors(chart, vm, $scope, $timeout){

            // Set Edge Options
            var colors = [{ 
                    name: 'mutation',
                    class: 'edgeMutation',
                    color: '#004358',
                    state: 'Highlight'
                }, {
                    name: 'cnGain.1',
                    class: 'edgeCnGain1',
                    color: '#1F8A70',
                    state: 'Highlight'
                }, {
                    name: 'cnLoss.1',
                    class: 'edgeCnLoss1',
                    color: '#BEDB39',
                    state: 'Highlight'
                }, {
                    name: 'cnGain.2',
                    class: 'edgeCnGain2',
                    color: 'purple', //'#FFE11A',
                    state: 'Highlight'
                }, {
                    name: 'cnLoss.2',
                    class: 'edgeCnLoss2',
                    color: '#FD7400',
                    state: 'Highlight'
                }];
            var colorMap = {
                'mutation' : colors[0],
                'cnGain.1' : colors[1],
                'cnLoss.1' : colors[2],
                'cnGain.2' : colors[3],
                'cnLoss.2' : colors[4]
            };

            // Default colors
            $timeout(function(){
                colors.forEach(function(item){
                    angular.element("." + item.class).css("border-color", item.color);
                });
                var degmap = {};
                chart.edges('edge[edgeType!="chromosome"]')
                    .forEach(function(edge){
                        this[edge.id()] = {'color':colorMap[edge.data("edgeType")].color, sizeEle:3};
                    }, degmap);
                chart.batchData(degmap);
            });

            vm.optEdgeColors = colors;

            // Update Edge Callback
            vm.updateEdge = function(item, stateName){
                if (item.state == stateName) return;
                item.state = stateName;
                var state;
                switch(stateName){
                    case "Highlight":
                        state = {'color':item.color, sizeEle:3};
                        break;
                    case "Hide":
                        state = {'color':'#FFFFFF', sizeEle:0};
                        break;
                    case "Show":
                        state = {'color':'#3993fa', sizeEle:3};
                        break;
                }

                // Set Legand color
                angular.element("." + item.class).css("border-color", state.color );

                // update Degree Map
                var degmap = {};
                chart.edges('edge[edgeType="'+item.name+'"]')
                    .forEach(function(edge){
                        
                        this.degmap[edge.id()] = this.state;
                    }, {degmap:degmap, state:state});
                chart.batchData(degmap);

            }
        }

        function initializeZoom(chart, _){
            chart.on('pan', _.debounce(function(e) {
                var zoom = Math.max(e.cy.zoom(), 1);
                var degmap = {};

                // Resize Nodes
                // Resize Edges
                // Resize Text


                //console.log(zoom)
                //var font = Math.ceil(Math.max(12/zoom, 1));
                // var sizeBdr = Math.ceil(Math.max(5/zoom, .5));
                // chart.nodes().forEach(function(node){
                //     this.degmap[node.id()] = {
                //         sizeEle: (node.degree()/this.zoom),
                //         sizeLbl: font,
                //         sizeBdr:sizeBdr
                //     };
                // }, { degmap:degmap, zoom:zoom, font:font, sizeBdr:sizeBdr });
                chart.batchData(degmap);
                
            }, 300));
        }

        function initializeNodeColors(chart, vm, $scope, osApi, $timeout, _){
            function calculateSelections(){
                var selectedNodes = chart.$('node[nodeType="patient"]:selected');
                var sums = {};
                
                // Calculate Sums
                selectedNodes.each(function(index, node){
                    if ( angular.isUndefined(sums[node.data().color]) ) sums[node.data().color] = 1;
                    else sums[node.data().color] += 1;
                });

                // Populate Legand
                $timeout(function(){
                    for (var i=0; i<vm.legandNodes.length; i++){
                        var color = vm.legandNodes[i].color;
                        vm.legandNodes[i].cnt = angular.isDefined(sums[color]) ? sums[color] : 0;
                    }
                });
            }
            // Debounce To Avoid Multiple Calls
            chart.on('select', _.debounce(calculateSelections, 20));
            chart.on('unselect', _.debounce(calculateSelections, 20))
            
            
            osApi.getSampleCategorizationNames().then(function(response) {
                var optNodeColors =  [{name: 'Default'},{name: 'Gender'},{name: 'Age At Diagnosis'}];
                if (angular.isDefined(response.payload.length)){
                    optNodeColors = optNodeColors.concat( response.payload
                        .map(function(item) { return {'name': item} }));

                }
                vm.optNodeColors = optNodeColors;
                vm.optNodeColor = vm.optNodeColors[0];
                $scope.$watch("vm.optNodeColor", function(){
                    var degmap = {};
                    switch(vm.optNodeColor.name){
                        case "Default":
                            vm.legandNodes = [{name:'Patients', color:'#3993fa', cnt:0}];
                            chart.$('node[nodeType="patient"]')
                                .forEach(function(node){
                                    degmap[node.id()] = {color:'#3993fa'};
                                });
                            chart.batchData(degmap);
                            break;
                        case "Gender":
                            vm.legandNodes = [{name:'Male', color:'purple', cnt:0}, {name:'Female', color:'green', cnt:0}];
                            chart.$('node[nodeType="patient"]')
                                .forEach(function(node){
                                    try{
                                        var gender = node.data("patient")[0][2];
                                        degmap[node.id()] = {color: (gender==='male') ? 'purple' :  'green' };
                                    }catch(e){
                                        degmap[node.id()] = {color: '#EEEEEE'};
                                    }
                                });
                            chart.batchData(degmap);
                            break;
                        case "Age At Diagnosis":
                            vm.legandNodes = [{name:'Young', color:'green', cnt:0}, {name:'Old', color:'red', cnt:0}];
                            chart.$('node[nodeType="patient"]')
                                .forEach(function(node){
                                    try{
                                        var age = Number(node.data("patient")[0][4]);
                                        degmap[node.id()] = {color: 'rgb(' + ((255 * age) / 100) + ',' + ((255 * (100 - age)) / 100) + ',0)'};
                                    }catch(e){
                                        degmap[node.id()] = {color: '#000000'};
                                    }
                                });
                            chart.batchData(degmap);
                            break;
                        default:
                            osApi.getSampleCategorization(vm.optNodeColor.name).then(function(response) {
                                vm.legandNodes = response.payload.tbl
                                    .map(function(e) {return e[0] + "|" + e[1]; })
                                    .filter(function(v, i, s) { return s.indexOf(v) === i; })
                                    .map(function(e) { var p = e.split("|");
                                        return { 'name': p[0], 'color': p[1] , cnt:0} });

                                    var rows = response.payload.rownames;
                                    var tbl = response.payload.tbl;
                                    var nodes = chart.$('node[nodeType="patient"]');

                                    // Revisit This.  Would be faster to not loop.
                                    for (var i=0; i<nodes.length; i++){
                                        var id = nodes[i].id();
                                        degmap[id] = {color:'#DDDDDD'}
                                        for (var ii=0; ii<rows.length; ii++){
                                            if (id==rows[ii]){
                                                degmap[id] = {color:tbl[ii][1]}
                                            }
                                        }
                                    }
                                    chart.batchData(degmap);
                                });
                            break;
                        }
                        calculateSelections();
                    });
            });

            vm.updateNode = function(item, select){
                chart.startBatch();
                chart.nodes('node[nodeType="patient"]')
                    .forEach(function(node){ 
                        if (node.style("background-color")==item.color) node[(select)?"select":"deselect"]();
                });
                chart.endBatch();
            }
        }

        function initializeLayouts(chart, vm, $scope){
            vm.optPatientLayouts = [{name: 'Hobo'},{name: 'Age At Diagnosis'}]; //,{name: 'Gender'}
            vm.optPatientLayout = vm.optPatientLayouts[0];
            $scope.$watch('vm.optPatientLayout', function(layout){                
                var nodes = chart.nodes('node[nodeType="patient"]');
                chart.startBatch();
                switch (layout.name){

                    // Hobo Chart Positions Are Sent From Server In Initial Dataset + Cached Load
                    case "Hobo":
                        nodes.forEach(function(node){ 
                            node.position(node.data("hobo")); 
                        });
                        break;

                    // Age At Dx Comes From Patient Table
                    case "Age At Diagnosis":
                        nodes.forEach(function(node){
                            try{
                                var age = Number(node.data("patient")[0][4]);
                                age = age.map(0, 100, -3000, 3000);
                                node.position({
                                    y: age, 
                                    x: (Math.pow(age, 2) / 5000) - 200
                                });
                            }catch(e){
                                node.position({x:100,y:0});
                            }
                        });
                        break;

                    // Gender Comes From Patient Table
                    case "Gender":
                        nodes
                            .filter(function(index, node){
                                try{ return (node.data("patient")[0][2].toLowerCase()=='male')}
                                catch(e){ return false; }
                            })
                            .forEach(function(node, index){
                                var a = 10;
                                var b = 100;
                                var angle = 0.1 * (index+1);
                                var x = -1000 + (a+b * angle) * Math.cos(angle);
                                var y = -1200 + (a+b * angle) * Math.sin(angle);
                                node.position({
                                    x: x,
                                    y: y
                                });
                            });
                        nodes
                            .filter(function(index, node){
                                return angular.isUndefined(node.data("patient")[0])
                            })
                            .forEach(function(node, index){
                                var a = 400;
                                var b = 400;
                                var angle = 0.1 * (index+1);
                                var x = -2500 + (a+b * angle) * Math.cos(angle);
                                var y = 0 + (a+b * angle) * Math.sin(angle);
                                node.position({
                                    x: x,
                                    y: y
                                });
                            });
                        nodes
                            .filter(function(index, node){
                                try{ return (node.data("patient")[0][2].toLowerCase()=='female')}
                                catch(e){ return false; }
                            })
                            .forEach(function(node, index){
                                var a = 400;
                                var b = 400;
                                var angle = 0.1 * (index+1);
                                var x = -1000 + (a+b * angle) * Math.cos(angle);
                                var y = 1200 + (a+b * angle) * Math.sin(angle);
                                node.position({
                                    x: x,
                                    y: y
                                });
                            });
                        break;
                }
                chart.endBatch();
            });
        }

        function loadGeneSet(osApi, vm, $q, chart){

            console.log("!!!");
            chart.remove('node[nodeType="gene"]');
var geneset = vm.optGeneSet.name;
console.log(geneset);
var edgeset = (geneset==="tcga.GBM.classifiers") ? "_mp_edges_gbm_mutation_01_12_tcga-GBM-classifiers" :
    (geneset==="tcga.pancan.mutated") ? "_mp_edges_gbm_cnv_11_tcga-pancan-mutated" :
    (geneset==="oncoVogel274") ? "_mp_edges_gbm_mutation_01_12_oncoVogel274" :
    "marker.genes.545";
//_mp_edges_gbm_mutation_01_12_oncoVogel274
            $q.all([
                osApi.query("_mp_genesets", {name:geneset}),
                osApi.query(edgeset)
                ]).then(function(results){
                console.log("!!! HI");
                    // Process Genes
                    var nodes = results[0].data[0].genes.map(function(item){
                       return {
                            group: "nodes",
                            grabbable: false,
                            locked: true,
                            selectable: false,
                            position: item.position,
                            data:{
                                color:"rgb(19, 150, 222)",
                                id:item.name,
                                display:"element",
                                nodeType:"gene",
                                degree:1,
                                sizeBdr:300,
                                sizeEle:500,
                                sizeLbl:500,
                                subType: "unassigned"
                            }
                        };
                    });

                    var edges = results[1].data.map(function(item){
                        return {group:"edges", grabbable:false, locked:true, data:{
                            color: "rgb(19,150,222)",
                            id: "mp_"+item.g+"_"+item.p,
                            display: "element",
                            edgeType: "CN",
                            sizeEle: 500,
                            source: item.g,
                            target: item.p
                        }};
                    });
                    console.log(edges);
                
                    
                    chart.add(nodes);
                    chart.add(edges);
                    
                    
                });
        }

        function loadData(osApi, vm, $q, cb){

            var dataPatients;

            var collection = osApi.convertDatasetNameFromRToMongo(vm.datasource);
            
            $q.all([
                osApi.query("_mp_genesets", {
                    $fields:['name'],
                    $limit:0
                }),
                osApi.query("_mp", {name:"chromosome"}),
                osApi.query("_mp_pt_gbm_cnv_11_mutation_01_12_oncoVogel274"),
                osApi.query(collection+"_pt", {
                    $fields:['patient_ID', 'gender', 'race', 'age_at_diagnosis', 'days_to_death','status_vital'],
                    $limit:0
                })
            
                ]).then(function(results){
                    
                    // Set Genes
                    vm.optGeneSets = results[0].data;
                    vm.optGeneSet = vm.optGeneSets[0];

                    // Get Edges + Nodes
                    var edges = [];
                    var nodes = [];

                    // Process Chromosome
                    var chromosomes = results[1].data[0].data;
                    Object.keys(chromosomes).forEach(function(key){
                        var chromosome = this.chromosomes[key][0];
                        this.edges.push(
                            {
                                group: "edges",
                                grabbable: false,
                                locked: true,
                                selectable: false,
                                data:{
                                    color: "rgb(19, 150, 222)",
                                    id: "ce"+key,   // Chromosome Edge (CE)
                                    display: "element",
                                    edgeType:"chromosome",
                                    sizeEle: 500,  // Style?
                                    source : "cp"+key,  // Chromosome P (CP)
                                    target : "cq"+key   // Chromosome Q (CQ)
                                }
                            });

                        // Telemere P
                        this.nodes.push({
                                group: "nodes",
                                grabbable: false,
                                locked: true,
                                selectable: false,
                                position:{
                                    x: chromosome.x,
                                    y: chromosome.p
                                },
                                data:{
                                    color:"rgb(19, 150, 222)",
                                    id:"cp"+key,
                                    display:"element",
                                    nodeType:"telomere",
                                    degree:1,
                                    sizeBdr:0,
                                    sizeEle:500,
                                    sizeLbl:12,
                                    subType: "unassigned"
                                }
                            });
                        // Telemere Q
                        this.nodes.push({
                               group: "nodes",
                                grabbable: false,
                                locked: true,
                                selectable: false,
                                position:{
                                    x: chromosome.x,
                                    y: chromosome.q
                                },
                                data:{
                                    color:"rgb(19, 150, 222)",
                                    id:"cq"+key,
                                    display:"element",
                                    nodeType:"telomere",
                                    degree:1,
                                    sizeBdr:500,
                                    sizeEle:500,
                                    sizeLbl:500,
                                    subType: "unassigned"
                                }
                            });
                        // Centromere Q
                        this.nodes.push({
                                group: "nodes",
                                grabbable: false,
                                locked: true,
                                selectable: false,
                                position:{
                                    x: chromosome.x,
                                    y: chromosome.c
                                },
                                data:{
                                    id:key,
                                    display:"element",
                                    nodeType:"centromere",
                                    degree:1
                                }
                            });
                    }, {chromosomes:chromosomes, edges:edges, nodes:nodes});
                    
                    // Process Patients    
                    nodes = nodes.concat(results[2].data.map(function(item){
                           var node = {
                                group: "nodes",
                                grabbable: false,
                                locked: true,
                                selectable: false,
                                position: item.position,
                                data:{
                                    color:"rgb(19, 150, 222)",
                                    id:item.name,
                                    display:"element",
                                    nodeType:"patient",
                                    degree:1,
                                    sizeBdr:300,
                                    sizeEle:500,
                                    sizeLbl:500,
                                    subType: "unassigned"
                                }
                            };
                            node.position.x -= 400000;
                            return node;
                    }));

                    

                    // Process Patients
                    dataPatients = results[3].data;


                    cb({edges:edges,nodes:nodes});
                });


            


            // Today multiple nested data calls are nessisary to obtain all the data to render the chart
            // Future server refactor should be done to limit number of calls and preformat data
            /*
            osApi.setDataset(vm.datasource).then(function() {

                // Patient Data
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    //var dataPatients = response.payload.tbl;

                    
                    // Marker Data
                    osApi.getMarkersNetwork(response.payload).then(function(response) {
                        var dataMarkers = angular.fromJson(response.payload).elements;

                        // Process Patient Nodes (Save Hobo Positions + Patient History Info + Color + SizeEle + SizeLbl)
                        dataMarkers.nodes
                            .filter(function(item) { return item.data.nodeType === 'patient'; })
                            .map(function(value) {
                                var data = value.data;
                                data.display = "element";
                                data.color = "#FFFF00"; //"rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                data.sizeBdr = 5;
                                data.hobo = {x: value.position.x, y: value.position.y};
                                data.patient = this.filter(function(item){ return item.patient_ID===data.id });
                            }, dataPatients);

                        // Process Non Patient Nodes
                        dataMarkers.nodes
                            .filter(function(item) {  return  item.data.nodeType != 'patient'; })
                            .map(function(value){
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                data.sizeBdr = 5;
                                value.locked = (value.data.nodeType!=="gene");
                                value.selectable = (value.data.nodeType==="gene");
                                value.grabbable = (value.data.nodeType==="gene");
                                if (value.data.nodeType!=="gene"){
                                    console.dir(value);
                                }
                                return value;
                            });

                        // Process Edges
                        dataMarkers.edges
                            .map(function(value){
                                
                                var data = value.data;
                                data.display = (data.edgeType=="chromosome") ? "element" : "none";

                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = 3;
                                data.sizeLbl = 12;
                                value.locked = true;
                                value.selectable = false;
                                value.grabbable = false;
                                 if (data.edgeType=="chromosome"){
                                    //debugger;
                                }
                                return value;
                            });

                        // Call Back
                        alert("R LOADED");
                        //cb(dataMarkers);
                    });
                });
            });
            */
            
        }
    }
})();
