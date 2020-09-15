
const baseInformation = {
  cellId: 21421421
};

function drawHeader(data) {
  const headerTemplate = document.getElementById('header-template').innerHTML;
  const headerHTML = Handlebars.compile(headerTemplate);
  document.getElementById('header').innerHTML = headerHTML(data);
}
function drawTraffic(data) {
  const trafficTemplate = document.getElementById('traffic-template').innerHTML;
  const trafficHTML = Handlebars.compile(trafficTemplate);
  document.getElementById('traffic').innerHTML = trafficHTML(data);
}
function drawVoLte(data) {
  const voLteTemplate = document.getElementById('vo-lte-template').innerHTML;
  const voLteHTML = Handlebars.compile(voLteTemplate);
  document.getElementById('vo-lte').innerHTML = voLteHTML(data);
}
function drawCsfb(data) {
  const csfbTemplate = document.getElementById('csfb-template').innerHTML;
  const csfbHTML = Handlebars.compile(csfbTemplate);
  document.getElementById('csfb').innerHTML = csfbHTML(data);
}

drawHeader(baseInformation);
drawTraffic();
drawVoLte();
drawCsfb();

const sock = new SockJS('http://192.168.101.174:3030/livestream');

const stomp = Stomp.over(sock);

stomp.connect({}, (frame) => {
  console.log('connected', frame);
  
  stomp.subscribe('/topic/check', (greeting) => {
    console.log(greeting);
  });
});

(async () => {
  const data = await getData();

  console.log(data);

  trafficGraph(data);
  voLteGraph(data);
  voLteGraph(data);

  scfbGraph(data);

  //generateGraph('#csfb-graph', data);
})()



//sock.onopen = function() {
   //console.log('open');
   //sock.send('test');
//};

//sock.onmessage = function(e) {
   //console.log('message', e.data);
   //sock.close();
//};

//sock.onclose = function() {
   //console.log('close');
//};
