/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var centered;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:400,
    height:300
})

var detailVisWidth = 400;
var detailVisHeight = 300;

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });


var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);

var dataSet = {};

var radiusDomain = [];
var hoursArray = [];

var barOn = false;

var xScale = d3.scale.linear().range([50, detailVisWidth - 50]);
var yScale = d3.scale.linear().range([detailVisHeight ,0]);


function loadStations() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){

        // console.log(data);

        var radiusScale = d3.scale.linear()
            .domain(d3.extent(radiusDomain))
            .range([1,10]);

        var project = function(d) {
            var latitude = parseFloat(d["NSRDB_LAT (dd)"]); 
            var longitude = parseFloat(d["NSRDB_LON(dd)"]);
            var array = projection([longitude, latitude]);
            return array;
        }

        // createDetailVis();

        var div = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);       

        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                var arr = project(d);
                if (arr !== null) {
                    return arr[0];
                }
                else return -100;
            }) 
            .attr("cy", function(d) {
                var arr = project(d);
                if (arr !== null) {
                    return arr[1];
                }
                else return -100;
            })
            .attr("r", function(d) {
                if (completeDataSet[d.USAF] !== undefined) {
                    return radiusScale(completeDataSet[d.USAF].sum);
                } else return 2;              
            })
            .attr("class", function(d) {
                if (completeDataSet[d.USAF] !== undefined) {
                    return "stationData";
                } else return "station";
            })
            .on("mouseover", function(d) {   
                div.transition()        
                    .duration(200)      
                    .style("opacity", .9);      
                div .html( "<b>" + 
                        "Station: " + "</b>" + d.STATION + "<br>" + "<b>" + 
                                "Sum: " + "</b>" + completeDataSet[d.USAF].sum + "<br>" )
                    .style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");    
            })                  
            .on("mouseout", function(d) {       
                div.transition()        
                    .duration(500)      
                    .style("opacity", 0); 
            })
            .on("click", function(d, i) {
                if (barOn == true) {
                    return updateDetailVis(d, d.USAF);
                } else {
                    return createDetailVis(d, d.USAF);
                }
            }); 

    });
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function(error,data){
        completeDataSet= data;
        // console.log(completeDataSet);

        for (ID in data) {
            radiusDomain.push(data[ID].sum);
            for (hourly in ID) {
                for (hour in hourly) {
                    hoursArray.push(data[ID].hourly[hour]);
                }
            }
        }
        console.log(hoursArray);
        console.log(d3.max(hoursArray));
        loadStations();
    })

}


d3.json("../data/us-named.json", function(error, data) {

    var usMap = topojson.feature(data,data.objects.states).features
    // console.log(usMap);

    svg.selectAll(".country").data(usMap).enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .on("click", clicked);

    loadStats();
});



// ALL THESE FUNCTIONS are just a RECOMMENDATION !!!!
var updateDetailVis = function(data, ID){

   detailVis.selectAll("rect")
       .data(completeDataSet[ID].hourly)
       .transition()
       .duration(1000)
       .attr("y", function(d) { return yScale(d) - 25; })
       .attr("height", function(d) { return detailVisHeight - yScale(d); })
       .attr("width", 10)
       .attr("fill-opacity", .20);


    detailVis.selectAll(".title")
        .text(data.STATION);

    // detailVis.selectAll("text")
    //    .append("text")
    //    .attr("class","title")
    //     .attr("x", (detailVisWidth / 2))             
    //     .attr("y", 20)
    //     .attr("text-anchor", "middle")  
    //     .style("font-size", "16px") 
    //     .text(data.STATION);
    //    ;


}

// the data passed through is the stations data, not the wrangled one.
var createDetailVis = function(data, ID){

    // detailVis
    // .selectAll("text")
    //     .data(data)
    //     .enter()
        // .append("text")
        // .attr("class","title")
        // .attr("x", (detailVisWidth / 2))             
        // .attr("y", 20)
        // .attr("text-anchor", "middle")  
        // .style("font-size", "16px") 
        // .text(data.STATION);

    detailVis
        .append("text")
        .attr("class","title")
        .attr("x", (detailVisWidth / 2))             
        .attr("y", 20)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text(data.STATION);;

        console.log(data.STATION);

    xScale.domain([0,24]);
    yScale.domain([0, 20000000]);

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        // .attr("transform", "translate(" + detailVisHeight + ",0)");

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("right");

    detailVis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (detailVisHeight - 25) + ")")
        .call(xAxis)
        .append("text")
        // .attr("transform", "translate(0," + detailVisHeight + ")")
        // .style("text-anchor", "end")
        .text("hours");

    detailVis.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (detailVisWidth - 50) + ", -25)")
        .call(yAxis)
        // .ticks(10)
        .append("text")
        .attr("y", 8)
        .attr("dy", ".71em")
        // .style("text-anchor", "end")
        .text("sum");
        // .attr("transform", "translate(");


 detailVis.selectAll(".bar")
        .data(completeDataSet[ID].hourly)
        .enter()
        .append("rect")
        .attr("x", function(d,i) { 
            return xScale(i);
        })
        .attr("y", function(d) {
            // console.log(d);
            // console.log(yScale(d));
            return yScale(d) - 25;
        })
        .attr("height", function(d) {
            return detailVisHeight - yScale(d) ;
        })
        .attr("width", 10)
        .attr("fill-opacity", .20);



    barOn = true;

}



// ZOOMING
function zoomToBB() {


}

function resetZoom() {
    
}

// adapted from bl.ocks.org/mbostock/2206590
function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  svg.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  svg.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");

}

