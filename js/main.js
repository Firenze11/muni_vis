$(function(){

    var dataMap;
    var url = 'http://webservices.nextbus.com/service/publicXMLFeed?a=sf-muni&';
    var lastReqTime = "0";
    var myMapVis;

    // preprocessing: reformatting data
    var dataLoaded = function (neighborhoods, routeList, routeConfig, vehicleLocation) {

        var cList = $('#control ul');
        cList.append('<li class="custom-checkbox"><input type="checkbox" id="cb_All"><label for="cb_All">All</label></li>');

        routeList.forEach( function(d) {
            var li = $("<li/>", {class: "custom-checkbox"}).appendTo(cList);
            $("<input>", {id: "cb_"+ d.tag, type: "checkbox"}).appendTo(li);
            $("<label>", {for: "cb_"+ d.tag}).text(d.title).appendTo(li);
        });


        dataMap =d3.map(vehicleLocation.vehicle, function(d) { return d.id; });
        // create mapvis
        myMapVis = new MapVis("mapVis", dataMap.values(), routeConfig, neighborhoods);

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
                var res = $.xml2json(d);
                lastReqTime = res.lastTime.time;
                mergeData(res.vehicle);
                myMapVis.onDataChange(dataMap.values());
            }
        })
    }
    function handleHover($cb, toggle) {
        var id = $cb.attr('id').slice(3);
        $(".vehicle.Rt"+id).each(function(i) {
            d3.select(this).classed("hovered", toggle);
        });
    }


    function handleClick($cb) {

        var id = $cb.attr('id').slice(3);
        var selectVal = $cb.prop('checked');

        if(id == 'All') {
            $("input:checkbox").prop( "checked", selectVal );

            $(".vehicle,.route,.stop").each(function() {
                d3.select(this).classed("selected", selectVal);
            });

        } else {
            if(!selectVal) { $("#cb_All").prop( "checked", false ); }

            $(".vehicle.Rt"+id+",.route.Rt"+id+",.stop.Rt"+id).each(function() {
                d3.select(this).classed("selected", selectVal);
            });
        }

        var displayData = [];
        $("input:checkbox:checked").each(function() {
            displayData.push($(this).attr('id').slice(3));
        });
    }

    function mergeData(newData) {
        newData.forEach( function(d) {
            dataMap.set(d.id, d);
        });
    }


    var startHere = function(){
        queue()
            .defer(d3.json, 'sfmaps/neighborhoods.json')
            .defer(d3.xml, url+'command=routeList')
            .defer(d3.xml, url+'command=routeConfig')
            .defer(d3.xml, url+'command=vehicleLocations&t='+lastReqTime)
            .await(function(error, neighborhoods, _routeList, _routeConfig, _vehicleLocation) {
                if (error) {
                    console.log(error);
                } else {
                    var routeList = $.xml2json(_routeList).route;
                    var routeConfig = $.xml2json(_routeConfig).route;
                    var vehicleLocation = $.xml2json(_vehicleLocation);
                    lastReqTime = vehicleLocation.lastTime.time;

                    return dataLoaded(neighborhoods, routeList, routeConfig, vehicleLocation);
                }
            });
        };
    startHere();
});

