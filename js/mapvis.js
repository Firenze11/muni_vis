MapVis = function(_parentElement, _data, _neighborhood, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.neighborhood = _neighborhood;
    this.eventHandler = _eventHandler;

    L.mapbox.accessToken = 'pk.eyJ1IjoibGV6aGlsaSIsImEiOiIwZTc1YTlkOTE1ZWIzYzNiNDdiOTYwMDkxM2U1ZmY0NyJ9.SDXoQBpQys6AdTEQ9OhnpQ';

    this.map = L.mapbox.map($('#'+ this.parentElement)[0], 'mapbox.dark', {
                  zoomControl: false
                })
                .setView([37.767394, -122.447354], 13);

    this.initVis();
};

MapVis.prototype.initVis = function(){
    var that = this;

    this.svg = d3.select(this.map.getPanes().overlayPane).append("svg");
    this.g = this.svg.append("g").attr("class", "leaflet-zoom-hide");

    //this.tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d; });
    //this.svg.call(this.tip);

    // default
    //this.filterfunc = function(_) { return true; };;

    this.wrangleData(); // filter, aggregate, modify data
    this.updateVis(true); // call the update method
};

MapVis.prototype.updateVis = function(_fresh){
    console.log('updating', this.data.length);
    var that = this;

    this.transform = d3.geo.transform({point: projectPoint}); //d3.geo.transform(methods): Creates a new stream transform using the specified hash of methods. The hash may contain implementations of any of the standard stream listener methods: sphere, point, lineStart, lineEnd, polygonStart and polygonStartonEnd
    this.geopath = d3.geo.path().projection(this.transform); //projection(location): Projects forward from spherical coordinates (in degrees) to Cartesian coordinates (in pixels). Returns an array [x, y] given the input array [longitude, latitude].


    this.nbhPaths= this.g.selectAll(".neighborhood")
        .data(this.neighborhood.features);
    //console.log(nbhPaths.enter()[0].length, nbhPaths[0].length, nbhPaths.exit()[0].length);
    this.nbhPaths.enter()
        .append('path')
            .attr("class", "neighborhood");

    this.picCircles = this.g.selectAll(".vehicle")
        .data(this.data, function(d) { return d.id; });
    //console.log(this.picCircles.enter()[0].length, this.picCircles[0].length, this.picCircles.exit()[0].length);

    this.picCircles.transition().ease("linear").duration(1000)
        .attr("transform", function(d) {
            var pos = that.map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon));
            return "translate(" + pos.x + ',' + pos.y + ")";
        });

    this.picCircles.enter()
        .append("g")
            .attr("class", function(d) { return "vehicle Rt"+ d.routeTag; })
            .interrupt()
            .attr("transform", function(d) {
                var pos = that.map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon));
                return "translate(" + pos.x + ',' + pos.y + ")";
            })
        .append("circle")
            .attr("r", 7)
            //.attr('title', function(d) { return d.lat; })
            //.style("fill", function(d) { return '#ffff00';})//return that.c20b(d.label); })
            //.style('opacity', 0.7)
            .on("click", function(d) {
                console.log(d);
            })
            .on('mouseover', function(d) {
                var title = 'Route: ' + d.routeTag + '<br>' + 'Direction: ' + d.dirTag;
                $(this).tooltip({
                    container: 'body',
                    placement: 'auto',
                    html: true,
                    title: title
                });
            });
        //.on('mouseover', this.tip.show)
        //.on('mouseout', this.tip.hide);
    //this.picCircles.exit().transition().style('opacity', 0.1);

    this.map.on("viewreset", reset);
    if(_fresh) reset();

    // Reposition the SVG to cover the features.
    function reset() {
        var bounds = that.geopath.bounds(that.neighborhood),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        that.svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        that.g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        that.picCircles.interrupt()
            .attr("transform", function(d) {
                var pos = that.map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon));
                return "translate(" + pos.x + ',' + pos.y + ")";
            });
        that.nbhPaths
            .attr('d',that.geopath);
    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
      var point = that.map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
      //console.log([point.x, point.y]);
      //return [point.x, point.y];
    }
};

MapVis.prototype.wrangleData= function(_filterFunc){
    var that = this;
    //var filterFunc = _filterFunc ? _filterFunc : function(_) { return true; };
    //console.log(filterFunc);

    //this.displayData = this.data.filter( function(d) { return that.filterFunc(d.dirTag); });
    //console.log("wrangling, displaydata length:", this.displayData.length);

    this.updateVis();
};


MapVis.prototype.onDataChange = function(_data){
    this.data = _data;
    //console.log("updating data, this.data length:", this.data.length, "filterFunc:", this.filterfunc);
    this.wrangleData();
};
