MapVis = function(_parentElement, _data, _routeConfig, _neighborhood){
    this.parentElement = _parentElement;
    this.data = _data;
    this.routeConfig = _routeConfig;
    this.neighborhood = _neighborhood;

    L.mapbox.accessToken = 'pk.eyJ1IjoibGV6aGlsaSIsImEiOiIwZTc1YTlkOTE1ZWIzYzNiNDdiOTYwMDkxM2U1ZmY0NyJ9.SDXoQBpQys6AdTEQ9OhnpQ';

    this.map = L.mapbox.map($('#'+ this.parentElement)[0], 'mapbox.light', {
                  zoomControl: false
                })
                .setView([37.767394, -122.447354], 13);
    this.initVis();
};


MapVis.prototype.initVis = function(){
    var that = this;

    this.stops = [];
    this.paths = [];
    this.routeConfig.forEach( function(d) {
        d.stop.forEach(function(e){
            var stop = L.circle(
                [+e.lat, +e.lon], 10,
                {color: "#"+d.color,
                    weight: 0.5,
                    opacity: 0.3,
                    className: "stop Rt"+d.tag
                }).addTo(that.map);

            that.stops.push(stop);
        });
        d.path.forEach( function(e) {
            var coorList = e.point.map( function(f) {
                return [+f.lat, +f.lon];
            });
            var path = L.polyline(
                coorList,
                {color: "#"+d.color, opacity: 0.3, weight: 0.5, className: "route Rt"+d.tag}
            ).addTo(that.map);

            that.paths.push(path);
        })
    });

    this.svg = d3.select(this.map.getPanes().overlayPane).append("svg");
    this.g = this.svg.append("g").attr("class", "leaflet-zoom-hide");

    this.locSymbol= function(_s) {
        return "M" +(-17.32*_s) +"," +(-30*_s) +
                " C" + (-17.32*_s) + "," + (-60*_s) + " "+
                       (17.32*_s) + "," + (-60*_s) + " "+
                       (17.32*_s) + "," + (-30*_s) + " L0,0Z";
    };
    this.dirSymbol= function(_s) {
        return "M" +(-5*_s) +"," +(5*_s) +
            " L" + (0*_s) + "," + (-10*_s) +
            " L" + (5*_s) + "," + (5*_s) + //" Z";
            " L" + (-5*_s) + "," + (5*_s);
    };

    this.wrangleData(true);
    this.updateVis(true);
};

MapVis.prototype.updateVis = function(_fresh){
    var that = this;

    this.transform = d3.geo.transform({point: projectPoint}); //d3.geo.transform(methods): Creates a new stream transform using the specified hash of methods. The hash may contain implementations of any of the standard stream listener methods: sphere, point, lineStart, lineEnd, polygonStart and polygonStartonEnd
    this.geopath = d3.geo.path().projection(this.transform); //projection(location): Projects forward from spherical coordinates (in degrees) to Cartesian coordinates (in pixels). Returns an array [x, y] given the input array [longitude, latitude].


    this.nbhPaths= this.g.selectAll(".neighborhood")
        .data(this.neighborhood.features);

    this.nbhPaths.enter()
        .append('path')
            .attr("class", "neighborhood");

    this.picCircles = this.g.selectAll(".vehicle")
        .data(this.data, function(d) { return d.id; });

    this.picCircles.transition().ease("linear").duration(1000)
        .attr("transform", function(d) {
            var pos = that.map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon));
            return "translate(" + pos.x + ',' + pos.y + ")";
        });
    this.picCircles.select(".veh_dir")
        .transition().ease("linear").duration(1000)
        .attr("transform", function(d) {
            return "translate(0,-16) rotate(" + d.heading + ") ";
        });


    var circleEnter = this.picCircles.enter()
            .append("g")
            .attr("class", function(d) { return "vehicle Rt"+ d.routeTag; })
            .interrupt()
            .attr("transform", function(d) {
                var pos = that.map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon));
                return "translate(" + pos.x + ',' + pos.y + ")";
            })
            .on('mouseover', function(d) {
                this.parentElement.appendChild(this);
            });

    circleEnter
        .append("path")
        .attr("class", "veh_loc")
        .attr("d",this.locSymbol(0.5))
            .on("click", function(d) {
                console.log(d);
            })
            .on('mouseover', function(d) {
                var title = 'Route: ' + d.routeTag + '<br>' +
                            'Id: ' + d.id + '<br>' +
                            'Speed: ' + d.speedKmHr + ' km/h';
                $(this).tooltip({
                    container: 'body',
                    placement: 'auto',
                    html: true,
                    title: title
                });
            });

    circleEnter
        .append("path")
        .attr("class", "veh_dir")
        .attr("d", this.dirSymbol(0.65))
        .style("fill", "#333");

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
    }
};

MapVis.prototype.wrangleData= function(_fresh){
    var that = this;
    if(_fresh) {
    }
    this.updateVis();
};

MapVis.prototype.onDataChange = function(_data){
    this.data = _data;
    this.wrangleData();
};
