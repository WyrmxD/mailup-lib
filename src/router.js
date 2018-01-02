'use strict';

const routes = require('./routes.json');

const router = (() => {
  const getApiBase = () => {
    return routes.api.base;
  };

  const getSmtpBase = () => {
    return routes.smtp.base;
  };

  const getLogon = () => {
    return getApiBase() + routes.api.logon;
  };

  const getAuth = () => {
    return getApiBase() + routes.api.auth;
  };

  const getToken = () => {
    return getApiBase() + routes.api.token;
  };

  const getConsole = () => {
    return getApiBase() + getConsoleUri();
  };

  const getConsoleUri = () => {
    return `${routes.api.version}${routes.api.console}`;
  };

  const getEndpoint = name => {
    return routes.endpoint[name];
  };

  const getSubscribeToGroup = groupId => {
    let url = getConsole() + getEndpoint('subscribeToGroup');
    return url.replace('{groupId}', groupId);
  };

  const getSubscribeToGroupUri = groupId => {
    let url = getConsoleUri() + getEndpoint('subscribeToGroup');
    return url.replace('{groupId}', groupId);
  };

  const getSmtp = () => {
    return getSmtpBase() + routes.smtp.version;
  };

  const getSmtpSendTemplate = () => {
    return getSmtp() + getEndpoint('sendTemplate');
  };

  const getSmtpSendTemplateUri = () => {
    return routes.smtp.version + getEndpoint('sendTemplate');
  };

  return {
    getApiBase: getApiBase,
    getLogon: getLogon,
    getAuth: getAuth,
    getToken: getToken,
    getConsole: getConsole,
    getConsoleUri: getConsoleUri,
    getEndpoint: getEndpoint,
    getSubscribeToGroup: getSubscribeToGroup,
    getSubscribeToGroupUri: getSubscribeToGroupUri,
    getSmtpBase: getSmtpBase,
    getSmtpSendTemplate: getSmtpSendTemplate,
    getSmtpSendTemplateUri: getSmtpSendTemplateUri
  };
})();

module.exports = router;
