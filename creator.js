function find_node(name){
  var result = $.grep(nodes, function(e){ return e.name === name; });
  if (result.length == 0) {
  // not found
    return null;
  } else if (result.length == 1) {
  // access the foo property using result[0].foo
    return result[0];
  } else {
  // multiple items found
    return result[0];
  }
}
var nodes = [
{ name: 'meow' },
{ name: 'wow' },
{ name: 'Microsoft'},
{ name: 'Amazon'},
{ name: 'Samsung'},
{ name: 'Apple'}
];

var links = [{
  source: find_node('Microsoft'),
  target: find_node('Amazon'),
  desc: "link 1",
  type: "new"
}, {
  source: find_node('Microsoft'),
  target: find_node('Amazon'),
  desc: "link 2",
  type: "down"
}, {
  source: find_node('Samsung'),
  target: find_node('Apple'),
  desc: "I am your father",
  type: "suit"
}, {
  source: find_node('Microsoft'),
  target: find_node('Amazon'),
  desc: "link 3",
  type: "overload"
}];

update_data();

var w = screen.width * 0.8,
  h = screen.height * 0.3;

var force = d3.layout.force()
  .nodes(nodes)
  .links(links)
  .size([w, h])
  .linkDistance(60)
  .charge(-300)
  .on("tick", tick);

var svg = d3.select("#drawhere").append("svg:svg")
  .attr("width", w)
  .attr("height", h);

var linkgroup = svg.append("svg:g");
var nodegroup = svg.append("svg:g");


// Per-type markers, as they don't inherit styles.
svg.append("svg:defs").selectAll("marker")
  .data(["normal", "down", "overload"])
  .enter().append("svg:marker")
  .attr("id", String)
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 15)
  .attr("refY", -1.5)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M0,-5L10,0L0,5");

// add a free flow button
svg.append("svg:rect")
  .attr("x", 10)
  .attr("y", 10)
  .attr("width", 50)
  .attr("height", 20)
  .attr("rx", 1)
  .attr("ry", 1)
  .on("click", freeflow);

  // add a free flow button
svg.append("svg:text")
  .attr("x", 13)
  .attr("y", 23)
  .text("Free Flow")
  .on("click", freeflow);

var path = linkgroup.selectAll("path");
var circle = nodegroup.selectAll("circle");
var text = nodegroup.selectAll("g");

var node_drag = d3.behavior.drag()
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend);



update_graph();
update_node_table();
update_link_select();
update_link_table();

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  linkgroup.selectAll("path").attr("d", function(d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
//      dr = 75 / d.linknum; //linknum is defined above
      dr = Math.sqrt(dx * dx + dy * dy) * 3/ d.linknum; //linknum is defined above
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  });

  nodegroup.selectAll("circle").attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  nodegroup.selectAll("g").attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}

function addNode(){
  console.log("addNode: " + $("#node_text").val());
  if (find_node($("#node_text").val()) === null) {
    nodes.push({ name: $("#node_text").val(), type: $("#node_type").val(), x:d3.randomUniform(0, w), y:d3.randomUniform(0, h)});
    update_data();
    update_graph();
    update_node_table();
    update_link_select();
  }
}

function addLink(){
  console.log("addLink: " + $("#link_src").val() + " to " + $("#link_tgt").val());
  src_node = find_node($("#link_src").val());
  tgt_node = find_node($("#link_tgt").val());
  desc = $("#link_desc").val()

  links.push({
    source: src_node,
    target: tgt_node,
    desc: desc,
    type: "normal"
  });
  update_data();
  update_graph();
  update_node_table();
  update_link_table();
}

function removeNode(key){
  console.log("removeNode: " + key);
  // iterate links and remove link where source or destination node matches

  links = links.filter(function(link){
    return (link.source.name != key && link.target.name != key)
  });
  nodes.forEach(function(node, index, object){
    if (node.name === key){
      console.log("removing node :" + JSON.stringify(node) );
      console.log("removing node index :" + index );
      object.splice(index,1);
    }
  });

  update_graph();
  update_node_table();
  update_link_table();
  update_link_select();
}

function removeLink(src, tgt, linknum){
  console.log("Remove Link:" + src + " " + tgt + " " + linknum);
  links = links.filter(function(link){
    return !(link.source.name === src && link.target.name === tgt && link.linknum === parseInt(linknum));
  });
  update_graph();
  update_node_table();
  update_link_table();
  update_link_select();
}

function update_graph(){
  path = path.data(links, function(d){ return d.source.name + '_' + d.target.name + '_' + d.linknum })
  path.enter()
    .append("svg:path")
    .attr("name", function(d){ return d.source.name + '_' + d.target.name + '_' + d.linknum })
    .attr("class", function(d) {
      return "link " + d.type;
    })
    .attr("marker-end", function(d) {
      return "url(#" + d.type + ")";
    });
  path.exit()
      .remove()

  circle = circle.data(nodes, function(d){ return d.name });
  circle.enter()
    .append("svg:circle")
    .attr("r", 6)
    .attr("class", function(d){
      return "node " + d.type;
    })
    .attr("name", function(d) {
      return d.name;
    })
    .call(node_drag);
//    .call(force.drag);
  circle.exit()
    .remove()

  text = text.data(nodes, function(d){ return d.name });
  text_update_group = text.enter().append("svg:g");

  text_update_group.append("svg:text")
    .attr("x", 8)
    .attr("y", ".31em")
    .attr("class", "shadow")
    .text(function(d) {
      return d.name;
    });

  text_update_group.append("svg:text")
    .attr("x", 8)
    .attr("y", ".31em")
    .text(function(d) {
      return d.name;
    });

  text.exit()
    .remove();

  force.start()
}

function update_node_table(){
  $("#tbody_nodes").empty();
  for (var key in nodes) {
        $("#tbody_nodes").append('<tr><td>' + nodes[key].name + '</td><td>' + nodes[key].type + '</td><td><span class="glyphicon glyphicon-remove" onclick=\'removeNode("'+nodes[key].name+'")\'></span></td></tr>');
  };
}

function update_link_table(){
  $("#tbody_links").empty();
  for (var key in links) {
        $("#tbody_links").append('<tr><td>' + links[key].source.name
        + '</td><td>'+ links[key].target.name
        + '</td><td>'+ links[key].desc
        + '</td><td><span class="glyphicon glyphicon-remove"onclick=\'removeLink("'+links[key].source.name+'","'+links[key].target.name+'",'+links[key].linknum+')\'></span></td></tr>');
  };
}

function update_link_select(){
  $("#link_src").empty();
  $("#link_tgt").empty();
  for (var key in nodes) {
    $("#link_src").append('<option value="' + nodes[key].name + '">' + nodes[key].name + '</option>');
    $("#link_tgt").append('<option value="' + nodes[key].name + '">' + nodes[key].name + '</option>');
  };
}

function update_data(){
  //sort links by source, then target
  links.sort(function(a, b) {
    if (a.source.name > b.source.name) {
      return 1;
    } else if (a.source.name < b.source.name) {
      return -1;
    } else {
      if (a.target.name > b.target.name) {
        return 1;
      }
      if (a.target.name < b.target.name) {
        return -1;
      } else {
        return 0;
      }
    }
  });

  //any links with duplicate source and target get an incremented 'linknum'
  for (var i = 0; i < links.length; i++) {
    if (i != 0 &&
      links[i].source.name === links[i - 1].source.name &&
      links[i].target.name === links[i - 1].target.name) {
      links[i].linknum = links[i - 1].linknum + 1;
    } else {
      links[i].linknum = 1;
    };
  };
}

function dragstart(d, i) {
    force.stop() // stops the force auto positioning before you start dragging
}

function dragmove(d, i) {
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    tick(); // this is the key to make it work together with updating both px,py,x,y on d !
}

function dragend(d, i) {
    d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
    tick();
    force.resume();
}

function writedata(){
  var jsondump = JSON.stringify({nodes: nodes, links: links});
  $("#data_textarea").val(jsondump);
}

function readdata(){
  var jsonparse = JSON.parse($("#data_textarea").val());
  nodes.splice(0, nodes.length);
  links.splice(0, links.length);

  $.merge(nodes, jsonparse['nodes']);
  $.merge(links, jsonparse['links']);
  build_link_node_ref();
  update_graph();
  update_node_table();
  update_link_table();
  update_link_select();
}

function build_link_node_ref(){
  for (var i = 0; i < links.length; i++) {
    for (var j = 0; j < nodes.length; j++) {
        if (links[i].source.name === nodes[j].name){
          links[i].source = nodes[j];
        }
        if (links[i].target.name === nodes[j].name){
          links[i].target = nodes[j];
        }
    }
  }
}

function freeflow(){
  force.stop();
  for (var j = 0; j < nodes.length; j++) {
    nodes[j].fixed = false;
  };
  force.start();
}

function hideread(){
  $('#jsonreadbutton').addClass("hidden");
}

function showread(){
  $('#jsonreadbutton').removeClass("hidden");
}
