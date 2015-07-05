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

var ractive = new Ractive({
    // The `el` option can be a node, an ID, or a CSS selector.
    el: '#container',
    // We could pass in a string, but for the sake of convenience
    // we're passing the ID of the <script> tag above.
    template: '#template',
    decorators: {
        sortable: sortableDecorator
    },
    // Here, we're passing in some initial data
    data: {
        // 
        api_lat: 37.77177,
        api_lon: -122.42353,
        rangeSize: 213000,
        minMag: 0,
        // placeholder
        events: {},
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
            that.set('events', data.features);
        });
    }
});



//TODO: 
// Decorator for time formatting
//how to send
//decorator for making the map
