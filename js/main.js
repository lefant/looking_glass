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
        },
        sammy: {
            exports: 'sammy'
        },
        jquery: {
            exports: 'jquery'
        }
    },
    paths: {
        d3: 'd3.v2',
        jquery: 'jquery-2.0.3',
    }
});

require(['jquery', 'sammy', 'd3', 'looking_glass', 'main_config'],
        function (jquery, sammy, d3, looking_glass, main_config) {
            var app = sammy(function() {
                this.get('#/', function() {
                    this.redirect('#/filter/crtt');
                });

                this.get('#/filter/:filter_id', function(context) {
                    var id = this.params['filter_id'];
                    console.log('selected filter: ', id);
                    try { looking_glass.cleanup(); } catch(err) {
                        console.log('cleanup error: ', err);
                    };

                    looking_glass.init(d3.select("#chart"));

                    var filter_string = main_config.filters[id],
                    ws = looking_glass.subscribe(main_config.host,
                                                 filter_string,
                                                 function(event) {
                                                     event.host =
                                                         event.instance_role + ' ' +
                                                         event.host.split('.')[0];
                                                     return event;
                                                 });

                    setInterval(function() {
                        looking_glass.render();
                    }, 500);
                });
            });
            app.run();
        });
