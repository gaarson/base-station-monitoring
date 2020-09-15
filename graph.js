function parseData(data) {
  return d3.nest() // nest function allows to group the calculation per level of a factor
    .key(function(d) { return d.name;})
    .entries(data);
}

function generateGradientColors(parsedData, colors) {
  var res = parsedData.map(function(d){ return d.key }) // list of group names
  return d3.scaleOrdinal()
    .domain(res)
    .range(['#1BF0AD', '#ED5B57'])
}

function createX(data, width) {
  return d3.scaleLinear()
    .domain([new Date().setMinutes(new Date().getMinutes() - 10), new Date()])
    .range([ 0, width ]);
  //return d3.scaleLinear()
    //.domain(d3.extent(data, function(d) { return d.year; }))
    //.range([ 0, width ]);
}
function xAxis(node, x, height) {
  
  node.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(
      d3.axisBottom(x)
        .ticks(1)
        .tickFormat(d3.timeFormat('%H:%M:%S'))
        .tickSizeOuter(0),
    );
}

function createY(data, height) {
  return d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return +d.n; })])
    .range([ height, 0 ]);
}
function yAxis(node, y) {
  node.append("g")
    .call(d3.axisLeft(y))
    .selectAll('text')
    .filter((d, i, arr) => i === arr.length - 1)
    .attr('fill', '#000')
    .attr('text-anchor', 'end')
    .attr('id', 'wrapText')
    .text('')
    .append('tspan')
    .attr('x', -12)
    .text('Мбит/с');

}

function createGridLines(node, width, height, x, y) {
  const makeYGridlines = (y) => d3.axisLeft(y).ticks(parseInt(6));
  const makeXGridlines = (x) => d3.axisBottom(x).ticks(parseInt(5));

  node
    .append('g')
    .call(
      makeYGridlines(y)
        .tickSize(-width)
        .tickFormat(''),
    )
    .select('.domain')
    .attr('d', '');
  node
    .append('g')
    .call(
      makeXGridlines(x)
        .tickSize(height)
        .tickFormat(''),
    )
    .select('.domain')
    .attr('d', '');
}

function addGradients(node, data) {
  const color = generateGradientColors(data);

  node.selectAll(".line")
    .data(data)
    .enter()
    .append('linearGradient')
    .attr("id", function(d) { return d.key })
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%")
    .selectAll("stop")
    .data(function(d) {
      return [
        {offset: "0%", color: color(d.key), opacity: 1},
        {offset: "10%", color: color(d.key), opacity: 0.3},
        {offset: "100%", color: color(d.key), opacity: 0},
      ]
    })
    .enter()
    .append("stop")
    .attr("offset", function(d) { return d.offset; })
    .attr("stop-color", function(d) { return d.color; })
    .attr("stop-opacity", function(d) { return d.opacity; });
}


function drawLines(node, data, x, y, fill) {
  const color = generateGradientColors(data);

  node.selectAll(".line")
      .data(data)
      .enter()
      .append("path")
        .attr("fill", fill)
        .attr("stroke", function(d) { return color(d.key) })
        .attr("stroke-width", 1.5)
        .attr("d", function(d){
          return d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(+d.n); })
            (d.values)
        });
}

function generateGraph(node) {
  d3.select(node).append("svg");
  const svg = d3.select(`${node} svg`);

  svg.attr("width", '100%').attr("height", '100%')

  const margin = {top: 0, right: 0, bottom: 30, left: 60};
  const width = parseFloat(svg.style('width')) - margin.left - margin.right;
  const height = parseFloat(svg.style('height')) - margin.top - margin.bottom;

  svg
    .append('rect')
    .style("filter", "url(#drop-shadow)")
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .attr('width', `${width}px`)
    .attr('height', `${height}px`)
    .attr('fill', '#17314b')

  const g = svg.attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  return { svg, node: g, width, height };
}


function trafficGraph(data) {
  const { svg, node, width, height } = generateGraph('#traffic-graph', data);

  const x = createX(data, width);
  xAxis(node, x, height);
  const y = createY(data, height);
  yAxis(node, y);

  const sumstat = parseData(data);

  sumstat.length = 2; // remove 
  
  createGridLines(node, width, height, x, y);

  addGradients(node, sumstat);

  drawLines(node, sumstat, x, y, (d) => `url(#${d.key})`);

  svg.selectAll('line').attr('stroke', 'rgba(224, 224, 224, 0.1)')
  svg.selectAll('text')
    .attr('fill', '#C4D2DE')
    .attr('style', 'font-size: 13px; font-family: var(--roboto)');
}

function voLteGraph(data) {
  const { svg, node, width, height } = generateGraph('#vo-lte-graph', data);

  const x = createX(data, width);
  xAxis(node, x, height);
  const y = createY(data, height);

  const sumstat = parseData(data);

  sumstat.length = 2; // remove 
  
  createGridLines(node, width, height, x, y);

  drawLines(node, sumstat, x, y, 'none');

  svg.selectAll('line').attr('stroke', 'rgba(224, 224, 224, 0.1)')
  svg.selectAll('text')
    .attr('fill', '#C4D2DE')
    .attr('style', 'font-size: 13px; font-family: var(--roboto)');
}

function scfbGraph(data) {
  const { svg, node, width, height } = generateGraph('#csfb-graph', data);

  const x = createX(data, width);
  xAxis(node, x, height);
  const y = createY(data, height);

  const sumstat = parseData(data);

  sumstat.length = 2; // remove 
  
  createGridLines(node, width, height, x, y);

  drawLines(node, sumstat, x, y, 'none');

  svg.selectAll('line').attr('stroke', 'rgba(224, 224, 224, 0.1)')
  svg.selectAll('text')
    .attr('fill', '#C4D2DE')
    .attr('style', 'font-size: 13px; font-family: var(--roboto)');
}

const getData = () => new Promise((resolve) => {
  d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered.csv", (data) => {
    resolve(data);
  });
});

