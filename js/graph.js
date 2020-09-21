const colors = ['#ED5B57', '#1BF0AD', '#2F80ED', '#F2994A', '#9B51E0', '#F2C94C', '#56CCF2', '#BDBDBD'];

let trafficColors;
let voLteColors;
let csfbColors;

function parseData(data) {
  return d3.nest() // nest function allows to group the calculation per level of a factor
    .key(function(d) { return d.ueId; })
    .entries(data);
}

function generateGradientColors(parsedData) {
  var res = parsedData.map(function(d){ return d.ueId; }) // list of group names

  return d3.scaleOrdinal()
    .domain(res)
    .range(colors)
}

function createX(data, width) {
  return d3.scaleTime()
    .domain([
      d3.min(data, function(d) { return new Date(d.timestamp); }),
      d3.max(data, function(d) { return new Date(d.timestamp); }),
    ])
    .range([ 0, width ]);
}
function xAxis(node, x, height) {
  node.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(
      d3.axisBottom(x)
        .ticks(5)
        .tickFormat(d3.timeFormat('%H:%M:%S'))
        .tickSizeOuter(0),
    );
}

function createY(data, height) {
  return d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return d.dlNumOfBytes / 131072; })])
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

function addGradients(node, data, colors) {

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
        {offset: "0%", color: colors(d.key), opacity: 1},
        {offset: "10%", color: colors(d.key), opacity: 0.3},
        {offset: "100%", color: colors(d.key), opacity: 0},
      ]
    })
    .enter()
    .append("stop")
    .attr("offset", function(d) { return d.offset; })
    .attr("stop-color", function(d) { return d.color; })
    .attr("stop-opacity", function(d) { return d.opacity; });
}

function drawShadowArea(node, data, x, y, height) {
  node.selectAll('.line')
      .data(data)
      .enter()
      .append('path')
      .attr('fill', (d) => `url(#${d.key})`)
      .attr('d', (d) => {
        return d3.area()
          .x(d => x(new Date(d.timestamp)))
          .y0(height)
          .y1(d => y(d.dlNumOfBytes / 131072))
          .curve(d3.curveMonotoneX)
          (d.values);
      });
}

function drawLines(node, data, x, y, fill, colors) {
  node.selectAll(".line")
      .data(data)
      .enter()
      .append("path")
        .attr("fill", 'none')
        .attr("stroke", function(d) { return colors(d.key) })
        .attr("stroke-width", 1.5)
        .attr("d", function(d){
          return d3.line()
            .x(function(d) { return x(new Date(d.timestamp)); })
            .y(function(d) { return y(d.dlNumOfBytes / 131072); })
            .curve(d3.curveMonotoneX)
            (d.values)
        });
}

function drawDots(node, data, x, y, colors, commeta) {
  node.selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .style('cursor', 'pointer')
      .style('fill', function (d) { return colors(d.key); })
      .attr('r', 4)
      .attr('cx', d => {
        return d.values.length ? x(new Date(d.values[0].timestamp)) : new Date();
      })
      .attr('cy', d => {
        return d.values.length ? y(d.values[0].dlNumOfBytes / 131072) : 0;
      })
  if (!commeta) 
    node.selectAll('dot')
        .data(data)
        .enter()
        .append('circle')
        .style('cursor', 'pointer')
        .style('fill', function (d) { return colors(d.key); })
        .attr('r', 4)
        .attr('cx', d => {
          return x(d.values.length ? new Date(d.values[d.values.length - 1].timestamp) : new Date());
        })
        .attr('cy', d => {
          return y(d.values.length ? d.values[d.values.length - 1].dlNumOfBytes / 131072 : 0);
        });
}

function drawTooltip(data, x, y, colors, graphId, commeta) {
  const timeParse = d3.timeFormat('%H:%M:%S');
  const graph = d3.select(graphId);
  const xPos = -19;
  const yPos = 30;

  data.forEach(i => {
    graph.append("div")
        .attr("class", "tooltip")
        .html(timeParse(i.values.length 
          ? new Date(i.values[0].timestamp) 
          : new Date()))
        .style('color', colors(i.key))
        .style(
          'left', 
          x(i.values.length ? new Date(i.values[0].timestamp) : new Date()) - xPos + 'px'
        )
        .style(
          'top',
          y(i.values.length ? i.values[0].dlNumOfBytes / 131072 : new Date()) - yPos + 'px'
        );
    if (!commeta) 
      graph.append("div")
          .attr("class", "tooltip")
          .html(timeParse(i.values.length 
            ? new Date(i.values[i.values.length - 1].timestamp) 
            : new Date()))
          .style('color', colors(i.key))
          .style(
            'left', 
            x(i.values.length ? new Date(i.values[i.values.length - 1].timestamp) : new Date()) - xPos + 'px'
          )
          .style(
            'top', 
            y(i.values.length ? i.values[i.values.length - 1].dlNumOfBytes / 131072 : new Date()) - yPos + 'px'
          );
  });

}

function generateGraph(node) {
  d3.select(node).append("svg");
  const svg = d3.select(`${node} svg`);

  svg.attr("width", '100%').attr("height", '100%')

  const margin = {top: 5, right: 5, bottom: 30, left: 60};
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
  const { svg, node, width, height } = generateGraph('#traffic-graph');

  const x = createX(data, width);
  xAxis(node, x, height);
  const y = createY(data, height);
  yAxis(node, y);

  const sumstat = parseData(data);

  createGridLines(node, width, height, x, y);

  addGradients(node, sumstat, trafficColors);

  drawLines(node, sumstat, x, y, (d) => `url(#${d.key})`, trafficColors);
  drawShadowArea(node, sumstat, x, y, height, trafficColors);

  svg.selectAll('line').attr('stroke', 'rgba(224, 224, 224, 0.1)')
  svg.selectAll('text')
    .attr('fill', '#C4D2DE')
    .attr('style', 'font-size: 13px; font-family: var(--roboto)');
}

function voLteGraph(data) {
  const { svg, node, width, height } = generateGraph('#vo-lte-graph');

  const x = d3.scaleTime()
    .domain([
      d3.min(data, function(d) { return new Date(d.timestamp).setMinutes(new Date(d.timestamp).getMinutes() - 1) }),
      d3.max(data, function(d) { return new Date(d.timestamp).setMinutes(new Date(d.timestamp).getMinutes() + 1); }),
    ])
    .range([ 0, width ]);
  const y = createY(data, height);

  const sumstat = parseData(data);

  createGridLines(node, width, height, x, y);

  drawLines(node, sumstat, x, y, 'none', voLteColors);

  drawDots(node, sumstat, x, y, voLteColors);
  drawTooltip(sumstat, x, y, voLteColors, '#vo-lte-graph');

  svg.selectAll('line').attr('stroke', 'rgba(224, 224, 224, 0.1)')
  svg.selectAll('text')
    .attr('fill', '#C4D2DE')
    .attr('style', 'font-size: 13px; font-family: var(--roboto)');
}

function csfbGraph(data) {
  const { svg, node, width, height } = generateGraph('#csfb-graph');

  const x = d3.scaleTime()
    .domain([
      d3.min(data, function(d) { return new Date(d.timestamp).setMinutes(new Date(d.timestamp).getMinutes() - 0.20) }),
      d3.max(data, function(d) { return new Date(d.timestamp).setMinutes(new Date(d.timestamp).getMinutes() + 1); }),
    ])
    .range([ 0, width ]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, function(d) { return d.dlNumOfBytes / 131072; }) - 0.05,
      d3.max(data, function(d) { return d.dlNumOfBytes / 131072; }) + 0.05
    ])
    .range([ height, 0 ]);

  const sumstat = parseData(data);

  createGridLines(node, width, height, x, y);

  drawLines(node, sumstat, x, y, 'none', csfbColors);

  drawDots(node, sumstat, x, y, csfbColors, true);
  drawTooltip(sumstat, x, y, csfbColors, '#csfb-graph', true);

  svg.selectAll('line').attr('stroke', 'rgba(224, 224, 224, 0.1)')
  svg.selectAll('text')
    .attr('fill', '#C4D2DE')
    .attr('style', 'font-size: 13px; font-family: var(--roboto)');
}
