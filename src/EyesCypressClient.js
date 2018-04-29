const extractResources = require('./extractResources');
const domNodesToCdt = require('./domNodesToCdt');
const port = Cypress.config('eyesPort');
function send(command, data) {
  return fetch(`http://localhost:${port}/eyes/${command}`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  })
    .then(resp => resp.text())
    .then(text => console.log('server answered', text));
}

const EyesServer = {
  open(baseUrl, appName, testName, viewportSize) {
    return send('open', {baseUrl, appName, testName, viewportSize});
  },

  checkWindow(resourceUrls, cdt) {
    return send('checkWindow', {resourceUrls, cdt});
  },

  close() {
    return send('close');
  },
};

Cypress.Commands.add('eyesOpen', (appName, testName, viewportSize) => {
  return cy.window().then(win => {
    return EyesServer.open(win.location.href, appName, testName, viewportSize);
  });
});

// TODO get url from test somehow
Cypress.Commands.add('eyesCheckWindow', () => {
  cy.log('Eyes: checkWindow');
  return cy.document().then(doc => {
    const domNodes = [doc.documentElement];
    const cdt = domNodesToCdt(domNodes);
    const resourceUrls = extractResources(domNodes);
    return EyesServer.checkWindow(resourceUrls, cdt);
  });
});

Cypress.Commands.add('eyesClose', () => {
  cy.log('Eyes: close');
  EyesServer.close();
});
