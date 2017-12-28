'use strict';

const assert = require('assert');
const mailup = require('..//mailup.js');
const nock = require('nock');

describe('mailup library', function() {
  let settings, client;
  let apiUrl = '/API/v1.1/Rest/ConsoleService.svc/Console';
  let baseUrl = 'https://services.mailup.com';

  before(function() {
    settings = {
      clientId: 'YOUR_CLIENT_ID',
      clientSecret: 'YOUR_CLIENT_SECRET',
      username: 'MAILUP_USERNAME',
      password: 'MAILUP_PASSWORD'
    };

    var api = nock(baseUrl)
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
    let endpoint = '/Email/Send';

    let callParams = {
      url: `${baseUrl}${apiUrl}${endpoint}`,
      verb: 'POST',
      body: JSON.stringify({
        Email: 'inaki.torres@piensa.io',
        idMessage: 4
      })
    };

    var api = nock(baseUrl)
      .post(`${apiUrl}${endpoint}`)
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
    let endpoint = `/Group/${groupId}/Recipient?ConfirmEmail=true`;

    let callParams = {
      url: `${baseUrl}${apiUrl}${endpoint}`,
      verb: 'POST',
      body: JSON.stringify({
        Email: 'inaki.torres@piensa.io'
      })
    };

    var api = nock(baseUrl)
      .post(`${apiUrl}${endpoint}`)
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
    let endpoint = `/Group/${groupId}/Recipient?ConfirmEmail=true`;

    var api = nock(baseUrl)
      .post(`${apiUrl}${endpoint}`)
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
});
