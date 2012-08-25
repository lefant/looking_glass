var margin = {top: 1, right: 1, bottom: 6, left: 1},
width = 960 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;
var formatNumber = d3.format(",.0f"),
format = function(d) { return formatNumber(d) + " lines"; },
color = d3.scale.category20();

var sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .size([width, height]);
var path = sankey.link();


(function() {
    console.log('looking_glass initializing...');

    looking_glass = {
        version: "0.0.1"
    };

    var index = {};
    var tbody;

    looking_glass.init = function(chart0) {
        var table = chart0.append("table")
            .attr("class", "table")
            .style("width", "300px");
        thead = table.append("thead")
        tbody = table.append("tbody");

        thead.append("tr")
            .selectAll("th")
            .data(["key", "metric"])
            .enter()
            .append("th")
            .text(function(column) { return column; });
    };

    looking_glass.render = function() {
        var indexData = [];
        for (var key in index) {
            indexData.push(index[key]);
        };

        var t = tbody.selectAll("div").data(indexData);
        var rows = tbody.selectAll("tr")
            .data(indexData)
        rows.enter().append("tr");

        var cells = rows.selectAll("td")
            .data(function(row) {
                return ['key', 'value'].map(
                    function(column) {
                        return {column: column, value: row[column]};
                    });
            });
        cells.enter().append("td");
        var bars = cells.selectAll("div")
            .data(function(d) { return [d]; });
        bars.enter().append("div").call(render_div)
        bars.transition().call(render_div)

        function render_div() {
            this
                .text(function(d) { return d.value; })
                .filter(function(d) { return d.column == 'value'; })
                .attr("class", "ok")
                .style("width", function(d) { return d.value * 100 + "px"; });
        };

        cells.exit().remove();
        bars.exit().remove();
    };


    var svg_link_g;
    var svg_node_g;
    var nodes = {};
    var edges = {};
    var max_id = 0;

    looking_glass.init_flow = function(svg0) {
        var svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");
        svg_link_g = svg.append("g");
        svg_node_g = svg.append("g");
    };

    looking_glass.render_flow = function () {
        var graph = to_lists();

        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        var links = svg_link_g.selectAll(".link")
            .data(graph.links, function(d) { return d.key })
        links.enter().append("path").attr("class", "link").call(render_link);
        links.transition().call(render_link);
        function render_link() {
            this
                .attr("d", path)
                .style("stroke-width",
                       function(d) { return Math.max(1, d.dy); });
        };

        var nodes = svg_node_g.selectAll(".node")
            .data(graph.nodes, function(d) { return d.id })
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        nodes.enter().append("g").attr("class", "node");

        var rects = nodes.selectAll("rect")
            .data(function(d) { return [d] },
                  function(d) { return d.id });
        rects.enter().append("rect").call(render_node_rect);
        rects.transition().call(render_node_rect);

        var texts = nodes.selectAll("text")
            .data(function(d) { return [d] },
                  function(d) { return d.id });
        texts.enter().append("text").call(render_node_text);
        texts.call(render_node_text);

        function render_node_rect() {
            this
                .attr("height", function(d) { return d.dy; })
                .attr("width", sankey.nodeWidth())
                .style("fill", function(d) {
                    return d.color = color(d.name.replace(/ .*/, ""));
                })
                .style("stroke",
                       function(d) { return d3.rgb(d.color).darker(2); });
        };
        function render_node_text() {
            this
                .attr("x", -6)
                .attr("y", function(d) { return d.dy / 2; })
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .attr("transform", null)
                .text(function(d) { return d.name; })
                .filter(function(d) { return d.x < width / 2; })
                .attr("x", 6 + sankey.nodeWidth())
                .attr("text-anchor", "start");
        };

    };

    function subscribe_common(host, query, handler) {
        console.log('subscribing (' + host + ' / ' + query + ') ...');
        var queryString = "query=" + encodeURI(query);
        var uri = "ws://" + host + "/index?subscribe=true&" + queryString;
        // if user is running mozilla then use it's built-in WebSocket
        window.WebSocket = window.WebSocket || window.MozWebSocket;
        var connection = new WebSocket(uri);
        connection.onopen = function () {
            console.log('ws opened (' + host + ' / ' + query + ')');
        };
        connection.onerror = function (error) {
            console.log('ws error (' + host + ' / ' + query + ')');
        };
        connection.onmessage = function (message) {
            try {
                var json = JSON.parse(message.data);
            } catch (e) {
                console.log('invalid JSON: ', message.data);
                return;
            };
            handler(json);
            var item = handler(json);
        };
    };

    looking_glass.subscribe = function (host, query, handler) {
        subscribe_common(host, query, function(json) {
            var item = handler(json);
            index[item.key] = item;
        });
    };

    looking_glass.subscribe_flow = function (host, query, handler) {
        subscribe_common(host, query, function(json) {
            var item = handler(json);
            if (! item) {
                return;
            };

            ensure_id(item.source);
            ensure_id(item.target);
            var source_id = nodes[item.source].id;
            var target_id = nodes[item.target].id;

            var key = [source_id, target_id];
            //var key = [item.source, item.target];
            edges[key] = {
                "key": key,
                "source": source_id,
                "target": target_id,
                "value": item.value};
        });
    };

    function to_lists() {
        var node_list = [];
        for (var key in nodes) {
            node_list.push(nodes[key]);
        };
        var edge_list = [];
        for (var key in edges) {
            edge_list.push(edges[key]);
        };
        return {"nodes": node_list, "links": edge_list};
    };

    function ensure_id(item_key) {
        if (nodes[item_key] == undefined) {
            var id = max_id;
            max_id += 1;
            nodes[item_key] = {"name": item_key, "id": id};
        };
    };

    console.log('looking_glass finished initializing');
})();
