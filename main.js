//debug off
Ractive.DEBUG = false;
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
  };
};

//map decorator

var mapDecorator = function(node, argument) {

  //get client width
  var clientWidth = $(window).width();

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

  var zoom = 7;

  if (clientWidth > 650) {
    // desktop
    zoom = 7;

  } else {
    //mobile
    zoom = 5;
  }

  map.setView([37.78, -122], zoom);

  //make a point
  var rangelatlng = L.latLng(37.77177, -122.42353);

  //build circle to indicate api range
  var range = L.circle(rangelatlng, null, {
    stroke: 1,
    weight: 2,
    dashArray: 3,
    color: "white",
    fillColor: "steelblue",
    fillOpacity: 0.2
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
      fillOpacity: 0.7
    };
  }

  //events
  function onEachPoint(feature, layer) {
    layer.on({
      mouseover: circleHover,
      // click: circleHover
    });

    var formatLoc = ractive.get('spliceLocation'),
      formatDat = ractive.get('formatDate');

    var place = feature.properties.place,
      time = feature.properties.time,
      link = feature.properties.url,
      mag = feature.properties.mag,
      popupContent = "<strong>Magnitude: </strong>" + mag +
      "<br/><strong>Place: </strong>" + formatLoc(place) +
      "<br/><strong>Time: </strong>" + formatDat(time) +
      '<br/><strong><a target="_blank" href=' + link + ">View on USGS</a>";

    layer.bindPopup(popupContent);
  }

  //hover function(s)

  //fires on hover
  function circleHover(e) {

    //get last selected target
    var lastTarget = ractive.get('lastSelected');

    // check to make sure lastTarget has been asigned
    if (lastTarget) {
      resetStyle(lastTarget);
    }
    //get the layer
    var layer = e.target;

    ractive.set('lastSelected', layer);

    layer.setStyle({
      color: "yellow", //stroke color, not fill
      weight: "3"
    }); //highlight color


    //highlight table
    var id = "." + e.target.feature.id;
    $('tr').removeClass('highlight');
    $(id).toggleClass('highlight');

    //scroll to table
    //http://api.jquery.com/scrollTop/
    var table = $('#table-col');
    table.animate({
      scrollTop: $(id).offset().top
    });

  }

  // fires when second circle hovers
  function resetStyle(e) {
    var layer = e;
    layer.setStyle({
      color: "white", //stroke color
      weight: 1
    });
  }


  L.tileLayer(
    'http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg', {
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
  }

  //add button to zoom out
  L.easyButton('glyphicon-zoom-out', function() {
    map.setView([37.78, -122], zoom);
  }).addTo(map);

  this.observe('geojson', function(newValue) {
    var status = this.get('asyncStatus');
    console.log("ajax data status is: " + status);
    if (status) {
      buildMap(newValue);
    }

  });

  return {
    teardown: function() {
      //teardown stuff
    }
  };
}; //end map decorator


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
      var string = loc.split(', California');
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
    sortColumn: 'time'
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
      var url =
        'http://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' +
        this.get('getYesterday') + '-08:00&latitude=' + this.get(
          'api_lat') + '&longitude=' + this.get('api_lon') +
        '&maxradiuskm=' + this.get('api_maxradiuskm') + '&minmagnitude=' +
        this.get('minMag');

      return url;

    },
    totalQuakes: function() {
      return this.get('events').length;
    }
  },
  oninit: function() {
    //get the computed url for usgs ajax call
    var url = this.get('makeUrl');
    //pass scope
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

  $('tr').removeClass('highlight');
  $("." + id).toggleClass('highlight');

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
      console.log(layer)
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
