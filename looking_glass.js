(function() {
     console.log('looking_glass initializing...');

     looking_glass = {
         version: "0.0.1"
     };

     var index = {};
     //var indexData = [];
     var chart;
     var tbody;

     looking_glass.init = function(chart0) {
         chart = chart0.append("div").attr("class", "chart");
         var table = chart0.append("table").attr("class", "table"),
             thead = table.append("thead");
         tbody = table.append("tbody");

         thead.append("tr")
             .selectAll("th")
             .data(["key", "metric"])
             .enter()
             .append("th")
             .text(function(column) { return column; });
     };

     function redraw() {
         var indexData = [];
         for (var key in index) {
             indexData.push(index[key]);
         };

         var s = chart.selectAll("div").data(indexData);
         //console.log('redraw: ', s.enter(), s.transition(), s.exit());
         s.enter()
             .append("div")
             .style("width", function(d) { return 300 + d.value * 500 + "px"; })
             .text(function(d) { return d.key + ' ' + d.value; });
         s.transition()
             .duration(1000)
             .style("width", function(d) { return 300 + d.value * 500 + "px"; })
             .text(function(d) { return d.key + ' ' + d.value; });
         s.exit().remove();

         var t = tbody.selectAll("div").data(indexData);
         // create a row for each object in the data
         var rows = tbody.selectAll("tr")
             .data(indexData)
             .enter()
             .append("tr");

         // create a cell in each row for each column
         var cells = rows.selectAll("td")
             .data(function(row) {
                       return ['key', 'value'].map(
                           function(column) {
                               return {column: column, value: row[column]};
                           });
                   });
         cells.enter()
             .append("td")
             .text(function(d) { return d.value; })
             .append("div")
             .style("width", function(d) { return d.value * 100 + "%"; });
         cells.transition()
             .duration(1000)
             .text(function(d) { return d.value; })
             .style("width", function(d) { return d.value * 100 + "%"; });
         cells.exit().remove();
     };

     looking_glass.subscribe = function (host, query, handler) {
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
             // try to decode json (I assume that each message from server is json)
             try {
                 var json = JSON.parse(message.data);
             } catch (e) {
                 console.log('invalid JSON: ', message.data);
                 return;
             };
             var item = handler(json);
             index[item.key] = item;
             redraw();
         };
     };

     console.log('looking_glass finished initializing');
 })();


//         var host = json.host.split(".")[0];
//         var service = json.service.split(" ");
//         var category = service[1];
//         var metric = json.metric + 1;
//         var service_type = service[2];
//         if (json.tags) {
//             var host_tags = json.tags.join(" ");
//             var cat_tags = json.tags.filter(is_cluster_tag).join(" ");
//         } else {
//             var host_tags = "";
//             var cat_tags = "";
//         };
//         //console.log('dbg: ', host, service, category, metric, service_type);
//         if (((service_type == "received") && (category != "scribe_overall")) ||
//             (service_type == "sent")) {
//             if (nodes[host] == undefined) {
//                 var id = max_id;
//                 max_id += 1;
//                 nodes[host] = {"name": host+" "+host_tags, "id": id};
//             }
//             if (nodes[category] == undefined) {
//                 var id = max_id;
//                 max_id += 1;
//                 nodes[category] = {"name": category+" "+cat_tags, "id": id};
//             }
//             var host_id = nodes[host].id;
//             var category_id = nodes[category].id;

//             if (service_type == "received") {
//                 var key = [category, host];
//                 edges[key] = {"source": category_id,
//                               "target": host_id,
//                               "value": metric};
//             } else if (service_type == "sent") {
//                 var key = [host, category];
//                 edges[key] = {"source": host_id,
//                               "target": category_id,
//                               "value": metric};
//             }
//         };
//     };
// }


