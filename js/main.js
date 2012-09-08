require.config({
    shim: {
        // jQuery: {
        //     exports: '$'
        // },
        underscore: {
            exports: '_'
        },
        d3: {
            exports: 'd3'
        },
        sankey: {
            deps: ['d3'],
            exports: function (d3) {
                return d3.sankey;
            }
        }
    },
    paths: {
        d3: 'd3.v2'
    }
});

require(['d3', 'looking_glass'],
        function (d3, looking_glass) {
            looking_glass.init(d3.select("#chart"));
            //looking_glass.init_flow(d3.select("#chart"));

            var host = "nisse.lefant.net:5556";
            looking_glass.subscribe(host, 'host =~ "%"', function(event) {
                                        return event;
                                    });

            setInterval(function() {
                            looking_glass.render();
                        }, 500);
        });

// require(['viewModelBase', 'bindingHandlers', 'Knockout'], function (ViewModelBase, BindingHandlers, ko) {
//     BindingHandlers.init();

//     var viewModelBase = new ViewModelBase();
//     ko.applyBindings(viewModelBase);
//     viewModelBase.initialize();
// });
