define(['d3', 'sankey', 'underscore'], function(d3, d3_sankey, _) {
           console.log('looking_glass initializing...');

           var margin = {top: 1, right: 1, bottom: 6, left: 1},
           width = 960 - margin.left - margin.right,
           height = 500 - margin.top - margin.bottom;
           var formatNumber = d3.format(",.0f"),
           format = function(d) { return formatNumber(d) + " lines"; },
           color = d3.scale.category20();

           var sankey = d3_sankey()
               .nodeWidth(15)
               .nodePadding(10)
               .size([width, height]);
           var path = sankey.link();



           looking_glass = {
               version: "0.0.1"
           };

           var index = {};
           var hosts = {};
           var services = {};
           var table;

           looking_glass.init = function(chart0) {
               table = chart0.append("table")
                   .attr("class", "table")
                   .style("width", "500px");

               table.append("thead").append("tr");
               table.append("tbody");
           };

           looking_glass.render = function() {
               var hostList = _.keys(hosts).sort();
               var serviceList = _.keys(services).sort();

               var serviceScales = {};
               serviceList.forEach(
                   function(service) {
                       var serviceValues = hostList.map(
                           function(host) {
                               return index[[host, service]];
                           }).filter(function(d) { return d != undefined; })
                           .map(function(d) { return d.metric; })
                           .concat([0.0001]);
                       serviceScales[service] = d3.scale.linear()
                           .domain(d3.extent(serviceValues))
                           .range(["0%", "100%"]);
                   });

               var thead = table.select("thead").select("tr");
               var hcells = thead.selectAll("th")
                   .data(["host"]
                         .concat(serviceList), function(id) { return id; });
               hcells.enter().append("th")
                   .text(function(service) { return service; });
               hcells
                   .text(function(service) { return service; });

               var rows = table.select("tbody").selectAll("tr")
                   .data(hostList, function(host) { return host; })
                   .sort();
               rows.enter().append("tr").append("th").text(function(d) { return d; });

               var cells = rows.selectAll("td")
                   .data(function(host) {
                             return serviceList.map(
                                 function(service) {
                                     if (index[[host, service]] == undefined) {
                                         return { key: [host, service] };
                                     } else {
                                         return index[[host, service]];
                                     };
                                 });
                         });
               cells.enter().append("td");
               var bars = cells.selectAll("div")
                   .data(function(d) { return [d]; },
                         function(d) { return d.key; });
               bars.enter().append("div").call(render_div);
               bars.call(render_div);

               function render_div() {
                   this
                       .filter(function(d) { return d.metric != undefined; })
                       .text(function(d) { return d3.round(d.metric, 2); })
                       .attr("class", function(d) { return d.state; })
                       .style("width", function(d) {
                                  var x = serviceScales[d.service];
                                  return x(d3.max([0.0001, d.metric]));
                              });
               };

               cells.exit().remove();
               bars.exit().remove();
           };


           var svg_link_g;
           var svg_node_g;
           var vertices = {};
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
               var graph = { nodes: _.values(vertices),
                             links: _.values(edges)
                           };

               sankey
                   .nodes(graph.nodes)
                   .links(graph.links)
                   .layout(32);

               var links = svg_link_g.selectAll(".link")
                   .data(graph.links, function(d) { return d.key });
               links
                 .enter()
                   .append("path").attr("class", "link").call(render_link);
               links.call(render_link);
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
               nodes.enter().append("g").attr("class", "node")
                   .attr("transform", function(d) {
                             return "translate(" + d.x + "," + d.y + ")";
                         });

               var rects = nodes.selectAll("rect")
                   .data(function(d) { return [d] },
                         function(d) { return d.id });
               rects.enter().append("rect").call(render_node_rect);
               rects.call(render_node_rect);

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
                                  return d.color =
                                      color(d.name.replace(/ .*/, ""));
                              })
                       .style("stroke", function(d) {
                                  return d3.rgb(d.color).darker(2); });
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
               var uri =
                   "ws://" + host + "/index?subscribe=true&" + queryString;
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
                   var item = handler(json);
               };
               return connection;
           };

           looking_glass.subscribe = function (host, query, handler) {
               return subscribe_common(host, query, function(json) {
                   var item = handler(json);
                   item["key"] = [item.host, item.service];
                   index[item.key] = item;
                   if (hosts[item.host] == undefined) {
                       hosts[item.host] = true;
                   };
                   if (services[item.service] == undefined) {
                       services[item.service] = true;
                   };
               });
           };

           looking_glass.subscribe_flow = function (host, query, handler) {
               return subscribe_common(host, query, function(json) {
                   var item = handler(json);
                   if (! item) {
                       return;
                   };

                   ensure_id(item.source);
                   ensure_id(item.target);
                   var source_id = vertices[item.source].id;
                   var target_id = vertices[item.target].id;

                   var key = [source_id, target_id];
                   //var key = [item.source, item.target];
                   edges[key] = {
                       "key": key,
                       "source": source_id,
                       "target": target_id,
                       "value": item.value};
               });
           };

           function ensure_id(item_key) {
               if (vertices[item_key] == undefined) {
                   var id = max_id;
                   max_id += 1;
                   vertices[item_key] = {"name": item_key, "id": id};
               };
           };

           console.log('looking_glass finished initializing');

           return looking_glass;
});
