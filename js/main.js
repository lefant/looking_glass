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

require(['d3', 'looking_glass', 'main_config'],
        function (d3, looking_glass, main_config) {
            looking_glass.init(d3.select("#chart"));
            //looking_glass.init_flow(d3.select("#chart"));

            looking_glass.subscribe(main_config.host,
                                    main_config.filter,
                                    function(event) {
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
