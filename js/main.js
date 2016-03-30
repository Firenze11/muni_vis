$(function(){

    // variables keeping global knowledge of the data
    var dataMap;
    var url = 'http://webservices.nextbus.com/service/publicXMLFeed?a=sf-muni&';
    var lastReqTime = "0";
    var myMapVis;

    // preprocessing: reformatting data
    var dataLoaded = function (arteries, freeways, neighborhoods, streets, routeList, routeConfig, vehicleLocation) {

        // create checkboxes and register event handlers
        var cList = $('#control ul');
        cList.append('<li class="custom-checkbox"><input type="checkbox" id="cb_All"><label for="cb_All">All</label></li>');
        //routeList = routeList.sort(function(a,b) { return a.tag < b.tag; });
        routeList.forEach( function(d) {
            var li = $("<li/>", {class: "custom-checkbox"}).appendTo(cList);
            $("<input>", {id: "cb_"+ d.tag, type: "checkbox"}).appendTo(li);
            $("<label>", {for: "cb_"+ d.tag}).text(d.title).appendTo(li);
        });

        // create mapvis
        dataMap =d3.map(vehicleLocation.vehicle, function(d) { return d.id; });
        var MyEventHandler = new Object();
        myMapVis = new MapVis("mapVis", dataMap.values(), neighborhoods, MyEventHandler);

        $("input:checkbox")
            .on('click', function() { handleClick($(this)); })
            .hover( function() { console.log( $(this).attr('id') ); });

        $("#control")
            .on("mouseenter","ul li", function() {
                handleHover($(this).children("input:checkbox"), true);
            })
            .on("mouseout","ul li", function() {
                handleHover($(this).children("input:checkbox"), false);
            });

        setInterval(updateVehicles, 15000);

    };

    function updateVehicles() {

        d3.xml(url+'command=vehicleLocations&t='+lastReqTime, function(error,d) {
            if (!error){
                // http://www.fyneworks.com/jquery/xml-to-json/
                var res = $.xml2json(d);
                lastReqTime = res.lastTime.time;
                //console.log("dataMap.values().length1", dataMap.values().length);
                console.log(res.vehicle.length);
                mergeData(res.vehicle);
                //console.log("dataMap.values().length2", dataMap.values().length);

                console.log('new data!', lastReqTime);
                myMapVis.onDataChange(dataMap.values());
            }
        })
    }
    function handleHover($cb, toggle) {
        //var $cb = $(this).children("input:checkbox");
        var id = $cb.attr('id').slice(3);
        $(".vehicle.Rt"+id).each(function(i) {
            //console.log(i, this);
            d3.select(this).classed("hovered", toggle);
            //d3.select(this).style("fill","#ff0000");
            //$(this).each().css({"fill": "#ff0000"});
            //console.log(i,$(this));
        });
    }


    function handleClick($cb) {

        var id = $cb.attr('id').slice(3);
        var selectVal = $cb.prop('checked');

        if(id == 'All') {
            $("input:checkbox").prop( "checked", selectVal );
            //if (selectVal) { $(".vehicle").show(); }
            //else { $(".vehicle").hide(); }

            $(".vehicle").each(function(i) {
                console.log(i, this);
                d3.select(this).classed("selected", selectVal);
            });

        } else {
            if(!selectVal) { $("#cb_All").prop( "checked", false ); }

            $(".vehicle.Rt"+id).each(function() {
                //console.log(i, this);
                d3.select(this).classed("selected", selectVal);
            });
        }

        var displayData = [];
        $("input:checkbox:checked").each(function() {
            displayData.push($(this).attr('id').slice(3));
        });
    }

    function mergeData(newData) {
        //var count = 0;
        newData.forEach( function(d) {
            //if(dataMap.has(d.id)) { count++; }
            dataMap.set(d.id, d);
        });
        //console.log(count);
    }


    var startHere = function(){
        queue()
            .defer(d3.json, 'sfmaps/arteries.json')
            .defer(d3.json, 'sfmaps/freeways.json')
            .defer(d3.json, 'sfmaps/neighborhoods.json')
            .defer(d3.json, 'sfmaps/streets.json')
            .defer(d3.xml, url+'command=routeList')
            .defer(d3.xml, url+'command=routeConfig')
            .defer(d3.xml, url+'command=vehicleLocations&t='+lastReqTime)
            .await(function(error, arteries, freeways, neighborhoods, streets, _routeList, _routeConfig, _vehicleLocation) {
                if (error) {
                    console.log(error);
                } else {
                    var routeList = $.xml2json(_routeList).route;
                    var routeConfig = $.xml2json(_routeConfig);
                    var vehicleLocation = $.xml2json(_vehicleLocation);
                    lastReqTime = vehicleLocation.lastTime.time;

                    //console.log('routeList', routeList);
                    //console.log('routeConfig', routeConfig.route[0]);
                    //console.log('vehicleLocation', vehicleLocation.vehicle[0]);

                    return dataLoaded(arteries, freeways, neighborhoods, streets, routeList, routeConfig, vehicleLocation);
                }
            });

        };
    startHere();
});

