'use strict';

const request = require('request');
const router = require('./router');

const mail = (() => {
  class Client {
    constructor(settings) {
      this.clientId = settings.clientId;
      this.clientSecret = settings.clientSecret;
      this.username = settings.username;
      this.password = settings.password;
      this.smtpUsername = settings.smtpUsername;
      this.smtpPassword = settings.smtpPassword;
      this.accessToken = '';
      this.refreshToken = '';
    }

    auth() {
      return this.retreiveAccessToken();
    }

    setTokens(tokenBody) {
      this.accessToken = tokenBody.access_token;
      this.refreshToken = tokenBody.refresh_token;
    }

    retreiveAccessToken() {
      return new Promise((resolve, reject) => {
        let self = this;
        const uriParams = `?grant_type=password&client_id=${this.clientId}&client_secret=${
          this.clientSecret
        }&username=${this.username}&password=${this.password}`;
        request(
          {
            uri: router.getToken() + uriParams,
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + self.base64Encode(this.clientId + ':' + this.clientSecret),
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          },
          function(err, response, body) {
            if (err) return reject(err);
            if (body && response.statusCode === 200) {
              let tokenBody = JSON.parse(body);
              self.setTokens(tokenBody);
              return resolve(tokenBody);
            } else {
              return reject(
                {
                  error: true,
                  noBody: true
                },
                null
              );
            }
          }
        );
      });
    }

    refreshAccessToken(callback) {
      var self = this;
      const uriParams = `?client_id=${self.clientId}&client_secret=${self.clientSecret}&refresh_token=${
        self.refreshToken
      }&grant_type=refresh_token`;
      request(
        {
          uri: router.getToken() + uriParams,
          method: 'POST',
          headers: {
            'Content-Length': uriParams.length,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        },
        function(error, response, body) {
          if (error) return callback(error, null);
          if (body && response.statusCode === 200) {
            self.setTokens(JSON.parse(body));
            return callback(null, body);
          } else {
            return callback(
              {
                error: true,
                noBody: true
              },
              null
            );
          }
        }
      );
    }

    callApi(params) {
      return this.callMethodInternal(params);
    }

    callMethodInternal(params) {
      return new Promise((resolve, reject) => {
        if (!params || !params.url)
          return reject(
            {
              error: true
            },
            null
          );

        if (!this.accessToken) {
          this.retreiveAccessToken().then(response => {
            this.makeRequest(params)
              .then(response => resolve(response))
              .catch(err => reject(err));
          });
        } else {
          return this.makeRequest(params)
            .then(response => resolve(response))
            .catch(err => reject(err));
        }
      });
    }

    makeRequest(params) {
      return new Promise((resolve, reject) => {
        let self = this;
        request(self.getRequestHeaders(params), function(err, response, body) {
          if (err) return reject(err);
          if (body && response.statusCode === 200) {
            return resolve(JSON.parse(body));
          }
          if (response.statusCode === 200) {
            return resolve({ success: true });
          } else if (response.statusCode == 401 && self.autoRefreshToken == true) {
            self.refreshAccessToken(err => {
              if (err) return reject(err);
              return self
                .callMethodInternal(params)
                .then(response => resolve(response))
                .catch(err => reject(err));
            });
          }

          return reject({
            error: true,
            msg: JSON.parse(body)
          });
        });
      });
    }

    getRequestHeaders(params) {
      return {
        uri: params.url,
        method: params.verb,
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
          'Content-Type': params.contentType == 'XML' ? 'application/xml' : 'application/json',
          Accept: 'application/x-www-form-urlencoded',
          'Content-Length': params.body ? params.body.length : 0
        },
        body: params.body,
        json: params.contentType == 'JSON' ? true : false
      };
    }

    base64Encode(data) {
      const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let o1, o2, o3, h1, h2, h3, h4, bits;
      let i = 0;
      let ac = 0;
      let enc = '';
      let tmpArr = [];
      if (!data) return data;
      do {
        // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);
        bits = (o1 << 16) | (o2 << 8) | o3;
        h1 = (bits >> 18) & 0x3f;
        h2 = (bits >> 12) & 0x3f;
        h3 = (bits >> 6) & 0x3f;
        h4 = bits & 0x3f;
        // use hexets to index into b64, and append result to encoded string
        tmpArr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      } while (i < data.length);
      enc = tmpArr.join('');
      let r = data.length % 3;
      return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    }

    subscribeToGroup(groupId, recipient) {
      const callParams = {
        url: router.getSubscribeToGroup(groupId),
        verb: 'POST',
        body: JSON.stringify({
          Email: recipient
        })
      };

      return this.callApi(callParams);
    }

    sendTemplate(params) {
      const callParams = {
        url: router.getSmtpSendTemplate(),
        verb: 'POST',
        body: JSON.stringify(this.buildBody(params))
      };

      return this.callApi(callParams);
    }

    sendMessage(params) {
      const callParams = {
        url: router.getSmtpSendMessage(),
        verb: 'POST',
        body: JSON.stringify(this.buildBody(params))
      };

      return this.callApi(callParams);
    }

    buildBody(params) {
      return {
        TemplateId: params.templateId,
        Subject: params.subject,
        From: { Name: params.fromName, Email: params.from },
        Html: params.html || null,
        Text: params.text || null,
        To: params.to,
        Cc: params.cc || [],
        Bcc: params.Bcc || [],
        ReplyTo: params.replyTo || null,
        CharSet: params.charset || 'utf-8',
        ExtendedHeaders: params.extendedHeaders || null,
        Attachments: params.attachments || null,
        EmbeddedImages: params.embeddedImages || null,
        XSmtpAPI: this.buildXSmtpApi(params),
        User: { Username: this.smtpUsername, Secret: this.smtpPassword }
      };
    }

    buildXSmtpApi(params) {
      let XSmtpApi = {};
      XSmtpApi.DynamicFields = params.dynamicFields || null;
      XSmtpApi.CampaignName = params.campaignName || null;
      XSmtpApi.CampaignCode = params.campaignCode || null;
      XSmtpApi.Header = params.header || false;
      XSmtpApi.Footer = params.footer || false;

      return XSmtpApi;
    }
  }

  return {
    getClient: function(settings) {
      return new Client(settings);
    }
  };
})();

module.exports = mail;
