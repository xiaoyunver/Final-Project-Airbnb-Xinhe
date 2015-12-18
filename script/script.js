var margin = {t:50,l:50,b:50,r:50},
    width = document.getElementById('map').clientWidth-margin.l-margin.r,
    height = document.getElementById('map').clientHeight-margin.t-margin.b;

var svg = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g').attr('class','map')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

var barW=document.getElementById('barchart').clientWidth-margin.l-margin.r,
    barH=document.getElementById('barchart').clientHeight-margin.t-margin.b;
//console.log(barH);
//console.log(height);


var priceScale = d3.scale.linear().domain([0,333]).range([1,300]);
var xScale = d3.scale.linear().domain([0,620]).range([0,barW])
var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(10);



//First, set up a projection
var bostonLngLat = [-71.088066,42.315520]; //from http://itouchmap.com/latlong.html
var projection = d3.geo.mercator()
    .translate([width/2, height/2])
    .center(bostonLngLat)
    .scale(80000);

//Then, define a
var path = d3.geo.path()
    .projection(projection);


var aPrice=0,bPrice=2100;
var nestdataPrice,nestdataCity;
var bnbamount=[];

var color = d3.scale.linear().domain([100, 150, 200]).range(['blue','red','yellow']);

var transitionA,centered;
var rangecount=[];
for(var i=0;i<62;i++)
{
    rangecount[i]=0;
}

var barChart= d3.select('.bar')
    .append('svg')
    .attr('width',barW+margin.l+margin.r)
    .attr('height',barH+margin.t+margin.b)
    .append('g')
    .attr('class','bar')
    .attr('transform','translate('+margin.l+','+margin.t+')');

barChart.append('g')
    .attr('class','axis')
    .attr("transform", "translate(0," + (barH - 2) + ")")
    .call(xAxis);



//creating a map structure
//var airbnb = d3.map();

//create a formatting function
// var formatNumber = d3.format('05');

//var colorScale = d3.scale.linear().domain([0,100000]).range(['white','red']);

//import geojson data
queue()
    .defer(d3.json, "data/ma_towns.json")
    .defer(d3.csv, "data/boston_listings_cleaned.csv",parseData)
    .await(function(err, ma_towns,airbnb){


        datamine(airbnb);
        draw(ma_towns,airbnb);
        drawbars(airbnb);
        btnclick(ma_towns,airbnb);
        console.log();


    })

function draw(ma_towns,airbnb){
    svg.selectAll('.county')
        .data(ma_towns.features)
        .enter()
        .append('path')
        .attr('class','county')
        .attr('d',path)
        .style('fill','#0E141D')
        .style('stroke','#9EA1A4')
        .style('stroke-width','.3px')
        .on('click',clicked);
      /*  .on('mouseover',function(){
            d3.select(this)
                .style('opacity','0.8');
        })
        .on('mouseleave',function(){
            d3.select(this)
                .transition()
                .duration(250)
                .style('opacity','1');
        });  */


    svg.selectAll('.label')
        .data(ma_towns.features)
        .enter()
        .append('text')
        .attr('class','label')
        .text(function(d){
            if((d.properties.TOWN == "BOSTON")||(d.properties.TOWN == "WEYMOUTH")||(d.properties.TOWN == "HINGHAM")){return;}
            return (d.properties.TOWN)
        })
        .attr('x',function(d){
            return path.centroid(d)[0];
        })
        .attr('y',function(d){
            return path.centroid(d)[1];
        })
        .style("pointer-events", "none");



    svg.selectAll('.airbnb')
        .data(airbnb)
        .enter()
        .append('circle')
        .attr('class','airbnb')
        .attr('cx',function(d){
            return projection([d.Px, d.Py])[0];
        })
        .attr('cy',function(d){
            return projection([d.Px, d.Py])[1];
        })
        .attr('r',function(d){
            if((d.price>=aPrice)&&(d.price<bPrice)){
                return '5';
            }
            else{
                return '0';
            }
        })
        .style('fill','#8cb010')
        .style('opacity',0.5)
        //.style('pointer-events','none')
        .call(attachTooltip);

    transitionA=d3.selectAll('.airbnb')
        .data(airbnb)
        .transition()
        .attr('class','airbnb')
        .attr('r',function(d){
            if((d.price>=aPrice)&&(d.price<bPrice)){
                return '5';
            }
            else{
                return '0';
            }
        })




}

function parseData(d) {


    var airbnb={
        price: +d.price,
        overall: d.overall_sa!=''? d.overall_sa:'None',
        bathrooms: d.bathrooms!=''? d.bathrooms:'None',
        bedrooms: d.bedrooms!=''? d.bedrooms:'None',
        address: d.address,
        Px: +d.X,
        Py: +d.Y,
        room_type: d.room_type,
        city: d.city
    }
    /*d.sort(function(a,b){
        if(a.price> b.price){
            return 1;
        }
        if(a.price< b.price){
            return -1;
        }
        return 0;
    })*/

    return airbnb;


}

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

//Tooltip

function attachTooltip(selection) {
    selection
        .on('mouseover', function (d) {
            var tooltip = d3.select('.custom-tooltip');
            //var xPosition = d3.select(this).attr('cx');
            //var yPosition = d3.select(this).attr('cy');
            var coords = d3.mouse(this);
            //console.log(coords);
            heightT=d3.select('.custom-tooltip').style('height');
            cyPo= d3.event.pageY;
            var yPo=function(heightT){return +heightT;}

            console.log(yPo);

            tooltip
                .transition()
                .style('opacity', 1)
                .style("top",  d3.event.pageY-210+ "px")
                .style("left", d3.event.pageX- 75 + "px");
              //  .style('left',coords[0]+75.0+'px')
               // .style('top',coords[1]+'px');

            //add color change


            tooltip.select('#tooltip_price').html('$'+d.price);
            tooltip.select('#tooltip_overall').html(d.overall);
            tooltip.select('#tooltip_bathrooms').html(d.bathrooms);
            tooltip.select('#tooltip_bedrooms').html(d.bedrooms);
            tooltip.select('#tooltip_address').html(d.address);
            //d3.selectAll('.Tvalue').style('color','gray');
            d3.select(this)
                .style('stroke','#dbf486')
                .style('stroke-width','2px')
                .style('fill','#8cb010')
                .style('opacity', 1);




        })

       /* .on('mousemove', function () {
            //var xy = d3.mouse(d);
            //var xPosition = parseFloat(d3.select(this).attr("cx"));
            //var yPosition = parseFloat(d3.select(this).attr("cy"));
            var xPosition = d3.select(this).attr('cx');
            var yPosition = d3.select(this).attr('cy');

            var tooltip = d3.select('.custom-tooltip');

            tooltip
                .style('left',xPosition+'px')
                .style('top',yPosition+'px');
        })*/


        .on('mouseleave', function () {
            d3.select('.custom-tooltip')
                .transition()
               // .style('left',margin.l+margin.r+'px')
               // .style('top',margin.t+margin.b+'px')
                .style('opacity', 0);
            d3.select(this)
                .transition()
                .duration(250)
                .style('stroke','none')
                .style('fill','#8cb010')
                .style('opacity', 0.5);
        })
}

function btnclick(ma_towns,airbnb){
    d3.selectAll('.btn')
        .on('click',function(){
            var id=d3.select(this).attr('id');



            if(id=='map'){
                //d3.selectAll('.arc').remove();
                aPrice=0;
                bPrice=2101;
                draw(ma_towns,airbnb);
                d3.selectAll('.airbnb')
                    .data(airbnb)
                    .transition()
                    .attr('class','airbnb')
                    .attr('cx',function(d){
                        return projection([d.Px, d.Py])[0];
                    })
                    .attr('cy',function(d){
                        return projection([d.Px, d.Py])[1];
                    })
                    .attr('r',function(d){
                        if((d.price>=aPrice)&&(d.price<bPrice)){
                            return '5';
                        }
                        else{
                            return '0';
                        }
                    });
            }
            else if(id=='clear'){
                d3.selectAll('.airbnb').remove();
            }
            else if(id=='0-63') {
                aPrice = 17;
                bPrice = 63;
                draw(ma_towns, airbnb);
                transitionA;
            }

            else if(id=='63-75'){
                aPrice=63;
                bPrice=75;
                draw(ma_towns,airbnb);
                transitionA;
            }

            else if(id=='75-90'){
                aPrice=75;
                bPrice=90;
                draw(ma_towns,airbnb);
                transitionA;
            }

            else if(id=='90-105'){
                aPrice=90;
                bPrice=105;
                draw(ma_towns,airbnb);
                transitionA;
            }
            else if(id=='105-130'){
                aPrice=105;
                bPrice=130;
                draw(ma_towns,airbnb);
                transitionA;
            }
            else if(id=='130-150'){
                aPrice=130;
                bPrice=150;
                draw(ma_towns,airbnb);
                transitionA;
            }
            else if(id=='150-189'){
                aPrice=150;
                bPrice=189;
                draw(ma_towns,airbnb);
                transitionA;
            }
            else if(id=='189-235'){
                aPrice=189;
                bPrice=235;
                draw(ma_towns,airbnb);
                transitionA;
            }
            else if(id=='235-300'){
                aPrice=235;
                bPrice=300;
                draw(ma_towns,airbnb);
                transitionA;
            }
            else if(id=='300-2100'){
                aPrice=300;
                bPrice=2101;
                draw(ma_towns,airbnb);
                transitionA;
            }
            else{
               // d3.selectAll('.airbnb').remove();
                aPrice=0;
                bPrice=2100;
                d3.selectAll('.airbnb')
                    .data(airbnb)
                    .transition()
                    .attr('class','airbnb')
                    .attr('cx',function(d){
                        return projection([d.Px, d.Py])[0];
                    })
                    .attr('cy',function(d){
                        return projection([d.Px, d.Py])[1];
                    })
                    .attr('r',function(d){
                        if((d.price>=aPrice)&&(d.price<=bPrice)){
                            return '5';
                        }
                        else{
                            return '0';
                        }
                    });
            }
        })
}



function datamine(airbnb){
    var maxPrice = d3.max(airbnb,function(d){return d.price;});
    var minPrice = d3.min(airbnb, function(d){return d.price;});
    console.log(maxPrice);

    var medianP = d3.median(airbnb, function(d){return d.price;});


    airbnb.forEach(function(d){
        for(var i=0;i<62;i++){
            if(i!=61){
                if((d.price>(i*10))&&(d.price<=((i+1)*10))){
                    rangecount[i]++;
                }
            }
            else{
                if(d.price>=610){
                    rangecount[i]++;
                }
            }


        }
    });
console.log(rangecount);
         nestdataPrice = d3.nest()
        .key(function(d){return d.room_type;})
        .entries(airbnb);


    nestdataCity = d3.nest()
        .key(function(d){return d.city;})
        .entries(airbnb);

    for(var i=0;i<nestdataCity.length;i++)
    {
        bnbamount.push([nestdataCity[i].values.length,nestdataCity[i].key]);
    }


}

function drawbars(airbnb){


    barChart.selectAll('.bar1')
        .data(rangecount)
        .enter()
        .append('rect')
        .attr('x',function(d,i){return i*(barW/rangecount.length);})
        .attr('y',function(d){return barH-priceScale(d);})
        .attr('width',function(){return barW/rangecount.length-1})
        .attr('height',function(d){return priceScale(d);})
        .style('fill','#0E141D')
        .on('mouseover',function(d,i){
            var coorrr=d3.mouse(this);
            var xPosition = coorrr[0]+75;
            var yPosition = coorrr[1]+height+margin.t+margin.b;

            var xx=d3.select(this).attr('x')
            var yy=d3.select(this).attr('y')

//Update the tooltip position and value
            d3.select(".bar-tooltip")
             //   .style("top", d3.event.pageY-200 + "px")
             //   .style("left", d3.event.pageX + "px")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px")
                .style('opacity','1')
                .select("#tooltip_amount")
                .text(d);

            d3.select('#PR')
                .html("</br>"+'$'+(i*10)+' - '+'$'+(i+1)*10);

            d3.select(this).style('fill','#273851');
        })
        .on('mouseleave',function(d){
            d3.select(this).style('fill','#0E141D');
            d3.select(".bar-tooltip").style('opacity','0');
        });


}


