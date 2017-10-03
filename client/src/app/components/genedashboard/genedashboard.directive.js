(function() {
  'use strict';

  angular
      .module('oncoscape')
      .directive('osGenedashboard', genedashboard);

  /** @ngInject */
  function genedashboard() {

    var directive = {
        restrict: 'E',
        templateUrl: 'app/components/genedashboard/genedashboard.html',
        controller: GenedashboardController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    /** @ngInject */
    function GenedashboardController(osApi, $state, $timeout, $window, d3) {

      var vm = this;
      osApi.setBusy(false)
      vm.datasource = osApi.getDataSource();

      vm.zoom = 1000000 // 1 MB
      vm.gene = "MYC"
      var samples = osApi.getCohort().sampleIds;
      //samples = ["TCGA-OL-A66H-01", "TCGA-3C-AALK-01", "TCGA-AR-A1AH-01", "TCGA-AC-A5EH-01", "TCGA-EW-A2FW-01"]

      // Elements
      var d3Chart = d3.select("#genedashboard-chart").append("svg");
      var d3Points = d3Chart.append("g");
      var genes, circles;

      // Properties
      var scaleX, scaleY, axisX, axisY;
      var data, minMax;
      var width, height;
      var lasso = d3.lasso()

      var draw = function(){ 
        
        // Size
        var layout = osApi.getLayout();
        width = $window.innerWidth - layout.left - layout.right;
        height = $window.innerHeight - 200; //10
        angular.element("#genedashboard-chart").css({
            "width": width + "px",
            "padding-left": layout.left + "px"
        });

        d3Chart.attr("width", width).attr("height", height);
        d3Points.attr("width", width).attr("height", height);

        // Scale
        var x = d3.scalePoint().domain(vm.genes).range([75, width - 75]),
            y = {};
  
        // Create a scale and brush for each gene.
        vm.genes.forEach(function(d) {
          // Coerce values to numbers.
          data.forEach(function(p) { p[d] = +p[d]; });
      
          y[d] = d3.scaleLinear()
              .domain(d3.extent(data, function(p) { return p[d]; }))
              .range([height - 20, 20]);
      
          // y[d].brush = d3.svg.brush()
          //     .y(y[d])
          //     .on("brush", brush);
        });

        // Returns the path for a given data point.
        function coords(d) {
          return vm.genes.map(function(p) { return [x(p), y[p](d[p])]; });
        }

        var coordpairs_bysmple = data.map(function(d) { return coords(d)})
        var coordpairs = _.flatten(coordpairs_bysmple, true)
  
        
          // Draw
          circles = d3Points.selectAll("circle").data(coordpairs);
          circles.enter().append("circle")
              .attr("class", "coord-node")
              .attr("cx", function(d) {
                  return d[0];
              })
              .attr("cy", function(d) {
                  return d[1];
              })
              .attr("r", 3)
              .style("fill", function(d) {
                  return d.color;
              });

          circles.exit()
              .transition()
              .duration(200)
              .delay(function(d, i) {
                  return i / 300 * 100;
              })
              .style("fill-opacity", "0")
              .remove();
          circles
              .style("fill", function(d) {
                  return d.color;
              })
              .transition()
              .duration(750)
              .delay(function(d, i) {
                  return i / 300 * 100;
              })
              .attr("r", 3)
              .attr("cx", function(d) {
                  return d[0];
              })
              .attr("cy", function(d) {
                  return d[1];
              })
              .style("fill", function(d) {
                  return d.color;
              })
              .style("fill-opacity", 0.8);

          


          //lasso.items(d3Points.selectAll("circle"));
          //d3Chart.call(lasso);
          
          //setSelected();
          //onCohortChange(osApi.getCohort());
          //onGenesetChange(osApi.getGeneset());
          osApi.setBusy(false);

        

       
      }
    
  
      

      vm.updateGene = function() {
              var test = vm.gene
              callGeneRegion()
      };
    
      var callGeneRegion = function(){

        osApi.query("lookup_hg19_genepos_minabsstart", {m: vm.gene}).then(function(response){
          var d = response.data
          if(d.length >0){
            vm.chr = d[0].chr
            osApi.query("lookup_hg19_genepos_minabsstart", {chr: vm.chr, pos: {$lt: d[0].pos + vm.zoom, $gt: d[0].pos - vm.zoom}}).then(function(resp){
              vm.genes_in_region = resp.data
              vm.genes =  _.pluck(vm.genes_in_region,"m" )
              osApi.query("brca_gistic2_ucsc-xena", {m: {$in:vm.genes}}).then(function(r){
                var molecular = r.data
                var sampleIdx = _.range(0,molecular[0].s.length)

                if(samples.length !=0){ 
                    sampleIdx = molecular[0].s.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }else{
                  samples = molecular[0].s
                }
                vm.genes =  _.pluck(molecular, "m")

                var tbl = jStat.transpose(molecular.map(function(g){return  g.d.filter(function(r, i){return _.contains(sampleIdx, i)})}))
                data = tbl.map(function(s, i){ var v =_.object( vm.genes,s); v["sample"] = samples[i]; return v }) 
                
                
                draw();
              });
            });
          }
        });
      }


      // Setup Watches

      // $scope.$watch('vm.gene', function() {
        //runs with every keystroke
      //     if (vm.gene === null) return;
      //     callGeneRegion()

      // });

      // App Event :: Resize
      osApi.onResize.add(draw);

      callGeneRegion();
        
    }  //end Controller
  }  //end genedashboard() 
})();