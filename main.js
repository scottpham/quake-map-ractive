// sortable decorator
var sortableDecorator = function(node, columnName) {
    // pass scope to the event handlers
    var that = this;

    // give it the sorted class if it's sorted
    function addClass() {
        if (that.get('sortColumn') === columnName) {
            $(node).addClass('sorted');
        } else($(node).removeClass('sorted'));
    }

    addClass();

    var handlers = {
        click: function(event) {
            //remove the sorted class from everything that has it
            $('.sorted').removeClass('sorted');
            //set the sort column to clicked, then add sorted class
            that.set('sortColumn', columnName).then(function() {
                addClass();
            });
        }
    };

    // Add the handlers
    for (eventName in handlers) {
        if (handlers.hasOwnProperty(eventName)) {
            node.addEventListener(eventName, handlers[eventName], false);
        }
    }

    // remove the handlers:
    // http://jsfiddle.net/tomByrer/9g3pB/11/
    return {
        teardown: function() {
            for (eventName in handlers) {
                if (handlers.hasOwnProperty(eventName)) {
                    node.removeEventListener(eventName, handlers[eventName], false);
                }
            }
        }
    }
};

//map decorator

var mapDecorator = function(node, argument) {

    // Set the range size (in Km?)
    var rangeSize = 213000;

    //size multiplier for quake circles
    var sizeConstant = 5;

    //set up map object

    var map = L.map('map', {
        //options
        scrollWheelZoom: false
    });

    this.map = map;

    map.setView([37.78, -122], 7);

    //make a point
    var rangelatlng = L.latLng(37.77177, -122.42353);

    //build circle to indicate api range
    var range = L.circle(rangelatlng, null, {
        stroke: false,
        color: "steelblue",
        fillOpacity: 0.3
    });

    //set range circle size
    range.setRadius(rangeSize);

    //add the range circle
    range.addTo(map);

    // size function
    function getSize(d) {
        return d * sizeConstant + 2;
    }

    //layer style
    function pointLayerStyle(feature) {

        var diameter = feature.properties.mag;

        return {
            radius: getSize(diameter),
            fillColor: 'maroon',
            color: "white",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };
    }

    //events
    function onEachPoint(feature, layer) {
        layer.on({
            mouseover: circleHover,
            click: circleHover
        });
    }

    //hover function(s)
    // declare for scope
    var lastTarget;
    //fires on hover

    function circleHover(e) {
        console.log(e);
        // check to make sure lastTarget has been asigned
        if (lastTarget) {
            resetStyle(lastTarget);
        }
        // resetStyle(lastTarget);
        var layer = e.target;
        lastTarget = e;
        // console.log(e.target.feature);
        layer.setStyle({
            color: "yellow", //stroke color, not fill
            weight: "3"
        }); //highlight color
    }

    // fires when second circle hovers
    function resetStyle(e) {
        var layer = e.target;
        layer.setStyle({
            color: "white", //stroke color
            weight: 1
        });

    }

    L.tileLayer('http://api.tiles.mapbox.com/v4/nbclocal.l391gdl1/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibmJjbG9jYWwiLCJhIjoiS3RIUzNQOCJ9.le_LAljPneLpb7tBcYbQXQ', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    }).addTo(map);

    //build map layer
    function buildMap(data) {
        var mapLayer = L.geoJson(data, {
            style: pointLayerStyle,
            onEachFeature: onEachPoint,
            //make a circle of each point
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, null);
            }
        });

        //actually add the thing
        mapLayer.addTo(map);
    };

    // var url = this.get('url');
    // console.log(url);

    this.observe('geojson', function(newValue) {
        var status = this.get('asyncStatus');
        console.log(status);
        if (status) {
            buildMap(newValue);
        }

    });

    return {
        teardown: function() {
            //teardown stuff
        }
    }
}


//MAIN RACTIVE INSTANCE


var ractive = new Ractive({
    // The `el` option can be a node, an ID, or a CSS selector.
    el: '#container',
    // We could pass in a string, but for the sake of convenience
    // we're passing the ID of the <script> tag above.
    template: '#template',
    decorators: {
        sortable: sortableDecorator,
        mapDecorator: mapDecorator
    },
    // Here, we're passing in some initial data
    data: {
        // 
        api_lat: 37.77177,
        api_lon: -122.42353,
        rangeSize: 213000,
        minMag: 0,
        lastSelected: null,
        // placeholder for all quake data
        events: {},
        asyncStatus: false,
        // helper function to format location
        spliceLocation: function(loc) {
            var string = loc.split(', California')
                //console.log(string[0]);
            return string[0];
        },
        // sort function takes 2 args: the dataset, and the column u want sorted
        mySort: function(dataset, column) {
            // var array = this.get('events');
            dataset = dataset.slice();
            // return the mutated copy, not the original
            return dataset.sort(function(a, b) {
                // if returns 1, then b is sorted higher (lower index) than a
                // mdn: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
                return a.properties[column] < b.properties[column] ? 1 : -1;
            });
        },
        formatDate: function formatDate(input) {
            var date = new Date(input);
            return date.toLocaleTimeString() + ", " + date.toLocaleDateString();
        },
        // default sort column to magnitude
        sortColumn: 'place'
    },
    // these properties depend on other properties
    computed: {
        api_maxradiuskm: function() {
            return (this.get('rangeSize') / 1000);
        },
        getYesterday: function() {
            var today = new Date();
            // convert to stime, then subtract one day: http://stackoverflow.com/questions/16401804/how-to-get-the-day-before-a-date-in-javascript
            var yesterday = new Date(today.getTime());
            yesterday.setTime(today.getTime() - 86400000);
            // convert to ISO
            var yesterdayISO = yesterday.toISOString();
            return yesterdayISO;
        },
        makeUrl: function() {
            return 'http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' + this.get('getYesterday') + '-08:00&latitude=' + this.get('api_lat') + '&longitude=' + this.get('api_lon') + '&maxradiuskm=' + this.get('api_maxradiuskm') + '&minmagnitude=' + this.get('minMag');
        },
        totalQuakes: function() {
            return this.get('events').length;
        }
    },
    oninit: function() {
        var url = this.get('makeUrl');

        var that = this;
        //asynchronously get the json data from USGS
        $.getJSON(url, function(data) {
            // bind the success with the 'events' property
            that.set('asyncStatus', true);
            that.set('events', data.features);
            that.set('geojson', data);

        });
    }
});

//proxy events
//http://docs.ractivejs.org/latest/proxy-events
ractive.on('select', function(event) {
    //get id and coordinates
    var id = event.context.id,
        lat = event.context.geometry.coordinates[1],
        lon = event.context.geometry.coordinates[0];

    //set zoom    
    this.map.setView([lat, lon], 14);

    //loop through each layer to find matching feature
    this.map.eachLayer(function(layer) {

        var feature = layer.feature;

        if (feature && feature.id == id) {
            //get last selected
            var last = ractive.get('lastSelected');
            //check to see if something has been selected
            if (last) {
                //reset the style to normal
                last.setStyle({
                    color: "white", //stroke color
                    weight: 1
                });
            }
            //set this quake to become the last selected
            ractive.set('lastSelected', layer);

            console.log("the id selected is " + feature.id);
            //highlight this target
            layer.setStyle({
                color: "yellow", //stroke color, not fill
                weight: "3"
            });
        }
    });
});



//TODO: 
// Decorator for time formatting
//how to send
//decorator for making the map
