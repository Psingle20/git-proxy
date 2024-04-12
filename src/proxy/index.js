const proxyApp = require('express')();
const bodyParser = require('body-parser');
const router = require('./routes').router;
const config = require('../config');
const db = require('../db');
const { GIT_PROXY_SERVER_PORT: proxyHttpPort } = require('../config/env').Vars;

const options = {
  inflate: true,
  limit: '100000kb',
  type: '*/*',
};

// Setup the proxy middleware
proxyApp.use(bodyParser.raw(options));
proxyApp.use('/', router);

const start = async () => {
  // Check to see if the default repos are in the repo list
  const defaultAuthorisedRepoList = config.getAuthorisedList();
  const allowedList = await db.getRepos();

  defaultAuthorisedRepoList.forEach(async (x) => {
    const found = allowedList.find((y) => y.project === x.project && x.name === y.name);
    if (!found) {
      await db.createRepo(x);
      await db.addUserCanPush(x.name, 'admin');
      await db.addUserCanAuthorise(x.name, 'admin');
    }
  });

  proxyApp.listen(proxyHttpPort, () => {
    console.log(`Proxy Listening on ${proxyHttpPort}`);
  });
  return proxyApp;
};

module.exports.start = start;
