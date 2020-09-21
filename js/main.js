const SOCKET_URL = 'http://192.168.101.174:8080/gs-guide-websocket';

let trafficData = [];
let voLteData = [];
let csfbData = [];

let headerData = JSON.parse(localStorage.getItem('header') || '{}');

let trafficUsers = {
  success: [],
  attempt: [],
  current: [],
};
let handoverIn = {
  success: [],
  attempt: []
}
let handoverOut = {
  success: [],
  attempt: []
}

let voLteUsers = {
  success: [],
  attempt: [],
  current: [],
}

csfbUsers = {
  success: [],
  attempt: [],
  current: [],
};

function filterDataByDate(data) {
  const tenMinutesAgo = new Date(new Date().setMinutes(new Date().getMinutes() - 10)).valueOf();
  return data.filter(item => new Date(item.timestamp).valueOf() > tenMinutesAgo);
}

function generateDataForCSFallback(users) {
  const oneMinutesAgo = new Date(new Date().setMinutes(new Date().getMinutes() - 1)).valueOf();
  const data =users.reduce((prev, curr) => {
    return [
      ...prev,
      {
        ueId: curr.ueId,
        dlNumOfBytes: curr.ueId * 1000,
        timestamp: new Date().valueOf(),
      }
    ];
  }, csfbData) 
  const oldUsers =  data.filter((item) => new Date(item.timestamp).valueOf() < oneMinutesAgo).map(i => i.ueId);

  if (oldUsers.length) {
    csfbUsers = {
      ...csfbUsers, 
      current: csfbUsers.current.filter(item => !oldUsers.includes(item.ueId))
    }
    return data.filter(item => !oldUsers.includes(item.ueId));
  }

  return data;
}

function drawHeader(data) {
  const headerTemplate = document.getElementById('header-template').innerHTML;
  const headerHTML = Handlebars.compile(headerTemplate);
  document.getElementById('header').innerHTML = headerHTML(data);
}

function drawTraffic(data, users, handover) {
  const trafficTemplate = document.getElementById('traffic-template').innerHTML;
  const trafficHTML = Handlebars.compile(trafficTemplate);
  document.getElementById('traffic').innerHTML = trafficHTML({ ...data, users, handover });

  trafficGraph(trafficData);
}

function drawVoLte(data, users) {
  const voLteTemplate = document.getElementById('vo-lte-template').innerHTML;
  const voLteHTML = Handlebars.compile(voLteTemplate);
  document.getElementById('vo-lte').innerHTML = voLteHTML({...data, users });

  voLteGraph(voLteData);
}

function drawCsfb(data, users) {
  const csfbTemplate = document.getElementById('csfb-template').innerHTML;
  const csfbHTML = Handlebars.compile(csfbTemplate);
  document.getElementById('csfb').innerHTML = csfbHTML({ ...data, users });

  csfbGraph(csfbData);
}

function collectData(entity, colors, attached, detached) {
  let info = { ...entity };

  if (attached.attemptObjectList && attached.attemptObjectList.length) {
    info = {
      ...info,
      attempt: [...info.attempt, ...attached.attemptObjectList],
    };
  }

  if (info.current && attached.successObjectList.length) {
    const arr = [...info.current, ...attached.successObjectList];
    info = {
      ...info, 
      success: arr,
      current: [...new Set(arr.map(item => item.ueId))]
        .map(i => {
          return { ueId: i, color: colors ? colors(i) : '' };
        })
    };
  }

  if (info.current && detached && detached.successObjectList.length) {
    const detachedArr = detached.successObjectList.map(i => i.ueId);
    info = {
      ...info,
      current: info.current.filter((user) => !detachedArr.includes(user.ueId)),
    };
  }

  return info;
}

const sock = new SockJS(SOCKET_URL);
const stomp = Stomp.over(sock);

stomp.connect({}, (frame) => {
  drawHeader(headerData);
  stomp.subscribe('/topic/cellSetup', data => {
    headerData = JSON.parse(data.body);
    localStorage.setItem('header', data.body);
    drawHeader(headerData);
  })

  stomp.subscribe('/topic/cellModification', data => { 
    const parsedData = JSON.parse(data.body);

    trafficData = filterDataByDate([...trafficData, ...parsedData.dataPlane.internet.objectList]);
    voLteData = filterDataByDate([...voLteData, ...parsedData.dataPlane.voLte.objectList]);

    trafficColors = generateGradientColors(parseData(trafficData));
    csfbColors = generateGradientColors(parseData(csfbData));
    voLteColors = generateGradientColors(parseData(voLteData));

    trafficUsers = collectData(
      trafficUsers, 
      trafficColors,
      parsedData.controlPlane.attach, 
      parsedData.controlPlane.detach
    );
    handoverIn = collectData(handoverIn, trafficColors, parsedData.controlPlane.handoverIn);
    handoverOut = collectData(handoverOut, trafficColors, parsedData.controlPlane.handoverOut);

    voLteUsers = collectData(
      voLteUsers, 
      voLteColors, 
      parsedData.controlPlane.voLteSetup, 
      parsedData.controlPlane.voLteRelease,
    );
    csfbUsers = collectData(
      csfbUsers,
      csfbColors,
      parsedData.controlPlane.csFallback
    );

    csfbData = generateDataForCSFallback(csfbUsers.current);

    drawTraffic(
      parsedData.controlPlane, 
      trafficUsers, 
      { in: handoverIn, out: handoverOut },
    );
    drawVoLte(parsedData.controlPlane, voLteUsers);
    drawCsfb(parsedData.controlPlane, csfbUsers);
  });

  stomp.subscribe('/topic/release', data => {
    const parsedData = JSON.parse(data.body);

    trafficData = filterDataByDate([...trafficData, ...parsedData.internet.objectList]);
    voLteData = filterDataByDate([...voLteData, ...parsedData.voLte.objectList]);
    trafficUsers = { success: [], attempt: [], current: [] };
    handoverIn = { success: [], attempt: [] };
    handoverOut = { success: [], attempt: [] };

    drawTraffic(
      {},
      trafficUsers, 
      { in: handoverIn, out: handoverOut },
    );
    drawVoLte({});
  });
}, () => {
  setTimeout(() => {
    location.reload();
  }, 2000)
});