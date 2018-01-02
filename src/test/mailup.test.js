'use strict';

const assert = require('assert');
const mailup = require('../mailup');
const nock = require('nock');
const router = require('../router');

describe('mailup library', function() {
  let client;
  let settings = require('./fixtures/settings.json');
  let consoleUri = router.getConsoleUri();
  let apiBaseUrl = router.getApiBase();

  before(function() {
    var api = nock(apiBaseUrl)
      .post(
        `/Authorization/OAuth/Token?grant_type=password&client_id=${settings.clientId}` +
          `&client_secret=${settings.clientSecret}&username=${settings.username}&password=${settings.password}`
      )
      .reply(
        200,
        '{"access_token":"0B0p0e2Q3T2N1x3O2l0n3q2n1h3K2J2b2u2B3l0m0O3H08342N0W1S373g242a0X1E3B190H1T1F361n0y2Y0l1t2Q' +
          '092H080C270d1R3y3E2T1A243J303F450U1u0u","expires_in":900,"refresh_token":"0j3L0j2y3V3U3R1D260R2Q3r063h2V0' +
          'e2F3C1W3V33002h210v0Y0p0n2j1p0f280u2l1m1N1U3M1x3m1w1G3l0V421Z1a3z262O3K3C04142p3t3N3R3U360i2T3M0v"}'
      );

    client = mailup.getClient(settings);
  });

  after(function() {
    nock.cleanAll();
  });

  it('should auth client', function(done) {
    client
      .auth()
      .then(response => {
        assert.notEqual(response.access_token, undefined);
        assert.notEqual(response.refresh_token, undefined);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('should make an API call me maybe', function(done) {
    let endpoint = router.getEndpoint('emailSend');

    let callParams = {
      url: `${apiBaseUrl}${consoleUri}${endpoint}`,
      verb: 'POST',
      body: JSON.stringify({
        Email: 'inaki.torres@piensa.io',
        idMessage: 4
      })
    };

    var api = nock(apiBaseUrl)
      .post(`${consoleUri}${endpoint}`)
      .reply(200, '{"Id":96,"InvalidRecipients":[],"Sent":1,"UnprocessedRecipients":[],"idMessage":4}');

    client
      .callApi(callParams)
      .then(response => {
        assert.notEqual(typeof response.Sent, undefined);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('should subscribe recipient to group', function(done) {
    let groupId = 9;

    let callParams = {
      url: router.getSubscribeToGroup(groupId),
      verb: 'POST',
      body: JSON.stringify({
        Email: 'inaki.torres@piensa.io'
      })
    };

    var api = nock(apiBaseUrl)
      .post(router.getSubscribeToGroupUri(groupId))
      .reply(200, '28');

    client
      .callApi(callParams)
      .then(response => {
        assert.notEqual(typeof response.Sent, undefined);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('should subscribe recipient to group using class function', function(done) {
    let groupId = 9;

    var api = nock(apiBaseUrl)
      .post(router.getSubscribeToGroupUri(groupId))
      .reply(200, '28');

    client
      .subscribeToGroup(groupId, 'inaki.torres@piensa.io')
      .then(response => {
        assert.notEqual(typeof response.Sent, undefined);
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('should sent template email', function(done) {
    let sendParams = {
      templateId: 4,
      to: [
        {
          Name: 'Iñaki Torres',
          Email: 'inaki.torres@piensa.io'
        }
      ],
      from: 'support@ooommmm.com',
      fromName: 'Support Ooommmm',
      subject: 'Template test'
    };

    var api = nock(router.getSmtpBase())
      .post(router.getSmtpSendTemplateUri())
      .reply(200, '{ "Status": "done", "Code": "0", "Message": "Ok" }');

    client
      .sendTemplate(sendParams)
      .then(response => {
        assert.equal(response.Status, 'done');
        assert.equal(response.Code, '0');
        assert.equal(response.Message, 'Ok');
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it('should replace dynamic fields using a template', function(done) {
    let sendParams = {
      templateId: 8,
      to: [
        {
          Name: 'Iñaki Torres',
          Email: 'inaki.torres@piensa.io'
        }
      ],
      from: 'support@ooommmm.com',
      fromName: 'Support Ooommmm',
      subject: 'Template test',
      dynamicFields: [{ N: 'firstname', V: 'Replaced Name' }]
    };

    var api = nock(router.getSmtpBase())
      .post(router.getSmtpSendTemplateUri())
      .reply(200, '{ "Status": "done", "Code": "0", "Message": "Ok" }');

    client
      .sendTemplate(sendParams)
      .then(response => {
        assert.equal(response.Status, 'done');
        assert.equal(response.Code, '0');
        assert.equal(response.Message, 'Ok');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});
