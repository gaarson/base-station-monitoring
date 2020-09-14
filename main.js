const pageHTML = document.getElementById('template').innerHTML;

const template = Handlebars.compile(pageHTML);

const context = {
  cellId: 21421421
};

document.getElementById('root').innerHTML = template(context);

var sock = new SockJS('http://192.168.101.174:8080/gs-guide-websocket');

const stomp = Stomp.over(sock);

stomp.connect({}, (frame) => {
  console.log('connected', frame);
  
  stomp.subscribe('/topic/greetings', (greeting) => {
    console.log(greeting);
  });

  stomp.send("/app/hello", {}, JSON.stringify({ name: 'minet' }));
});


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
