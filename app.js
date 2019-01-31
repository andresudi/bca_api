require("dotenv").config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const request = require('request')
const rp = require("request-promise");

const crypto = require('crypto')
const Base64 = require('js-base64').Base64
const sha256 = require('js-sha256').sha256;

const BCA = require('./controllers/bca1')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/bca', indexRouter);
app.use('/users', usersRouter);

String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
}

const client_id = process.env.client_id
const client_secret = process.env.client_secret
const jogres = `${client_id}:${client_secret}`
const API_KEY = process.env.API_KEY
const API_SECRET = process.env.API_SECRET

app.get('/sakuku', (req, res) => {
  request.post({ url: 'https://sandbox.bca.co.id/api/oauth/token', 
    headers: { Authorization: 'Basic ' + Base64.encode(jogres) }, 
    form: { grant_type: 'client_credentials' } }, 
    function (err, httpResponse, body) {

      let accessToken = JSON.parse(body).access_token;

      let requestBody = {
          "MerchantID": "89000",
          "MerchantName": "Merchant One",
          "Amount": "100.22",
          "Tax": "0.0",
          "TransactionID": "156479",
          "CurrencyCode": "IDR",
          "RequestDate": "2015-04-29T09:54:00.234+07:00",
          "ReferenceID": "123465798"
      };

      let requestBodyReplace = JSON.stringify(requestBody).replaceAll('\n', '').replaceAll('\t', '').replaceAll('\r', '').replaceAll(' ', '')
      let sha256 = crypto.createHash('sha256').update(requestBodyReplace).digest("hex").toLowerCase()
      let timeStamp = new Date().toISOString()
      let stringHash = "POST:/sakuku-commerce/payments:" + accessToken + ":" + sha256 + ":" + timeStamp;
      let key = 'd20490f3-2124-4144-af3d-8a6d72c91b7b'
      let signature = crypto.createHmac('sha256', key).update(stringHash).digest('hex')

      let options = {
          uri: 'https://sandbox.bca.co.id/sakuku-commerce/payments',
          method: 'POST',
          headers: {
              'Authorization': 'Bearer ' + accessToken,
              'X-BCA-Key': API_KEY,
              'X-BCA-Timestamp': timeStamp,
              'X-BCA-Signature': signature
          },
          json: requestBody
      }

      request(options, function (error, response, body) {
        res.send(body);
      })
  })
})

function getToken() {
  console.log("masuk")
  let access_token;
  let options = {
    method: "POST",
    uri: 'https://sandbox.bca.co.id/api/oauth/token',
    headers: {
      Authorization: `Basic ${Base64.encode(jogres)}`
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  }
  rp(options)
    .then(response => {
      response.access_token
    })
    .catch(err => {
      console.log(err)
    })
}

app.get('/balance-information', (req, res) => {
  let accessToken;
  let options = {
    method: "POST",
    uri: 'https://sandbox.bca.co.id/api/oauth/token',
    headers: {
      Authorization: `Basic ${Base64.encode(jogres)}`
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  }
  rp(options)
    .then(response => {
      accessToken = response.access_token

      let requestBody = {
        "CorporateID": "BCAAPI2016",
        "AccountNumber": "0201245680"
      }

      let requestBodyReplace = JSON.stringify(requestBody).replaceAll('\n', '').replaceAll('\t', '').replaceAll('\r', '').replaceAll(' ', '')
      console.log("request body Replace balance Information ===> ", requestBodyReplace)

      let sha256 = crypto.createHash('sha256').update(requestBodyReplace).digest("hex").toLowerCase()
      let timeStamp = new Date().toISOString()
      let stringHash = `GET:/banking/v3/corporates/${requestBody.CorporateID}/accounts/${requestBody.AccountNumber}:` + accessToken + ":" + sha256 + ":" + timeStamp;
      
      let key = API_SECRET
      let signature = crypto.createHmac('sha256', key).update(stringHash).digest('hex')

      let options = {
        uri: `https://sandbox.bca.co.id/banking/v3/corporates/${requestBody.CorporateID}/accounts/${requestBody.AccountNumber}`,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
            'X-BCA-Key': API_KEY,
            'Origin': 'https://sandbox.bca.co.id',
            'X-BCA-Timestamp': timeStamp,
            'X-BCA-Signature': signature
        },
        json: requestBody
      }

      rp(options)
      .then((result) => {
        console.log(result)
        res.status(200).json({
          "result": result
        })
      })
      .catch((err) => {
        console.log(err)
        res.status(400).json({
          "error": err.error
        })
      })

    })
    .catch(err => {
      console.log("err_1", err)
    })
})

app.post('/fund-transfer', (req, res) => {
  let accessToken;
  let options = {
    method: "POST",
    uri: 'https://sandbox.bca.co.id/api/oauth/token',
    headers: {
      Authorization: `Basic ${Base64.encode(jogres)}`
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  }
  rp(options)
    .then(response => {
      accessToken = response.access_token

      let requestBody = {
        "CorporateID" : "BCAAPI2016",
        "SourceAccountNumber" : "0201245680",
        "TransactionID" : "0000001",
        "TransactionDate" : new Date().toISOString().slice(0,10),
        "ReferenceID" : "12345/PO/2018",
        "CurrencyCode" : "IDR",
        "Amount" : "100000.00",
        "BeneficiaryAccountNumber" : "0201245681",
        "Remark1" : "Transfer Test",
        "Remark2" : "Online Transfer"
      }

      let requestBodyReplace = JSON.stringify(requestBody).replaceAll('\n', '').replaceAll('\t', '').replaceAll('\r', '').replaceAll(' ', '')
      let sha256 = crypto.createHash('sha256').update(requestBodyReplace).digest("hex").toLowerCase()
      let timeStamp = new Date().toISOString()
      // let timeStamp = "2019-01-09T02:10:24.848Z"

      let stringHash = `POST:/banking/corporates/transfers:` + accessToken + ":" + sha256 + ":" + timeStamp;
      let key = API_SECRET
      let signature = crypto.createHmac('sha256', key).update(stringHash).digest('hex')

      let options = {
        uri: `https://sandbox.bca.co.id/banking/corporates/transfers`,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
            'X-BCA-Key': API_KEY,
            'Origin': 'https://sandbox.bca.co.id',
            'X-BCA-Timestamp': timeStamp,
            'X-BCA-Signature': signature
        },
        json: requestBody
      }

      rp(options)
        .then((result) => {
          console.log(result)
          res.status(200).json({
            "result": result
          })
        }).catch((err) => {
          console.log(err)
          res.status(400).json({
            "error": err.error
          })
        });
    })
    .catch((err) => {
      console.log(err)
    })
})

app.post('/topup/', (req, res) => {
  let requestBody = {
    "amount": req.body.amount,
    "memo": req.body.memo
  }

  let requestBodyReplace = JSON.stringify(requestBody).replaceAll('\n', '').replaceAll('\t', '').replaceAll('\r', '').replaceAll(' ', '')
  let sha256 = crypto.createHash('sha256').update(requestBodyReplace).digest("hex").toLowerCase()
  let timeStamp = new Date()
  timeStamp.setHours(timeStamp.getHours() + 7);

  let timeStamp1 = new Date()
  timeStamp1.setHours(timeStamp1.getHours() + 7);
  let validTime = timeStamp1.toISOString().split('Z')[0]

  let stringHash = "KsvcN0dSgNOMOluDMQBzGUsQekorspr416IEPCFqLZhi13uykYDQFKH7yaBiWGCmYbmpqHOISaynEYQ1DYGQjmtj4tkhBa4rha8IE712kDUprmXptFlhXeV5" + ":" + sha256 + ":" + validTime;
  let signature = crypto.createHmac('sha256', "KsvcN0dSgNOMOluDMQBzGUsQekorspr416IEPCFqLZhi13uykYDQFKH7yaBiWGCmYbmpqHOISaynEYQ1DYGQjmtj4tkhBa4rha8IE712kDUprmXptFlhXeV5").update(stringHash).digest('hex')

  let options = {
    uri: `http://localhost:9501/api/investor/001.01.0000088/topup`,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzM4NCJ9.eyJpYXQiOjE1NDIyODg4NDIsImV4cCI6MTU0MjI4OTE0MjAsImp0aSI6IkdZZlREeTd1MGctSVJqdXBxdDVWbUEiLCJjb250ZXh0Ijp7ImRldmljZVR5cGUiOiJXQlIiLCJyb2xlIjoiaW52ZXN0b3IiLCJ1c2VyVHlwZSI6IklWVCIsInVzZXJVSUQiOiIwMDEuMDEuMDAwMDA4OCJ9fQ.6gC-7UMN1ZeJfbs6MX93RXxLNorywlQODY8ixl3cuoIoSSs14fwfFp-nFG8VFymY',
      'Content-Type': 'application/json',
      'Timestamp': validTime,
      'Signature': signature
    },
    json: requestBody
  }

  rp(options)
    .then((result) => {
      console.log("result ===>", result)
      res.status(200).json({
        "result": result
      })
    })
    .catch((err) => {
      res.status(400).json({
        "error": err.error
      })
    })
})

app.post('/fund-transfer-domestic', (req, res) => {
  let accessToken;
  let options = {
    method: "POST",
    uri: 'https://sandbox.bca.co.id/api/oauth/token',
    headers: {
      Authorization: `Basic ${Base64.encode(jogres)}`
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  }
  
  rp(options)
    .then((response) => {
      accessToken = response.access_token

      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1; 
      var yyyy = today.getFullYear();

      if(dd<10) 
      {
          dd='0'+dd;
      } 

      if(mm<10) 
      {
          mm='0'+mm;
      } 

      today = yyyy+'-'+mm+'-'+dd;

      let requestBody = {
        "TransactionID" : "00000001",
        "TransactionDate" : "2018-05-03",
        "ReferenceID" : "12345/PO/2018",
        "SourceAccountNumber" : "0201245680",
        "BeneficiaryAccountNumber" : "0201245501",
        "BeneficiaryBankCode" : "BRONINJA",
        "BeneficiaryName" : "Tester",
        "Amount" : "100000.00",
        "TransferType" : "LLG",
        "BeneficiaryCustType" : "1",
        "BeneficiaryCustResidence" : "1",
        "CurrencyCode" : "IDR",
        "Remark1" : "Transfer Test",
        "Remark2" : "Online Transfer"
      }

      let requestBodyReplace = JSON.stringify(requestBody).replaceAll('\n', '').replaceAll('\t', '').replaceAll('\r', '').replaceAll(' ', '')
      let sha256 = crypto.createHash('sha256').update(requestBodyReplace).digest("hex").toLowerCase()
      let timeStamp = new Date().toISOString()
      let stringHash = `POST:/banking/corporates/transfers/domestic:` + accessToken + ":" + sha256 + ":" + timeStamp;
      let key = API_SECRET
      let signature = crypto.createHmac('sha256', key).update(stringHash).digest('hex')

      let options = {
        uri: `https://sandbox.bca.co.id/banking/corporates/transfers/domestic`,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
            'X-BCA-Key': API_KEY,
            'X-BCA-Timestamp': timeStamp,
            'X-BCA-Signature': signature,
            "ChannelID": "95051",
            "CredentialID": "BCAAPI"
        },
        json: requestBody
      }

      rp(options)
        .then((result) => {
          console.log(result)
          res.status(200).json({
            "TransactionID": result.TransactionID,
            "TransactionDate": new Date().toISOString().slice(0,10),
            "ReferenceID": result.ReferenceID,
            "PPUNumber": result.PPUNumber
          })
        })
        .catch((err) => {
          console.log("1.",err.error)
          res.status(400).json({
            "error": err.error
          })
        })
    })
    .catch((err) => {
      console.log(err.error)
    })
})

app.get('/virtual-account', (req, res) => {
  request.post({
    url: 'https://sandbox.bca.co.id/api/oauth/token',
    headers: {
      Authorization: `Basic ${Base64.encode(jogres)}`
    },
    form: {
      grant_type: 'client_credentials'
    }
  },
  function (err, httpResponse, body) {

    let accessToken = JSON.parse(body).access_token;

    let requestBody = {
      "CompanyCode": "10111",
      "CustomerNumber": "12345",
      "RequestID": "201711101617000000700000000001",
    }

    let requestBodyReplace = JSON.stringify(requestBody).replaceAll('\n', '').replaceAll('\t', '').replaceAll('\r', '').replaceAll(' ', '')
    let sha256 = crypto.createHash('sha256').update(requestBodyReplace).digest("hex").toLowerCase()
    let timeStamp = new Date().toISOString()
    let stringHash = `GET:/va/payments?CompanyCode=${requestBody.CompanyCode}&RequestID=${requestBody.RequestID}:` + accessToken + ":" + sha256 + ":" + timeStamp;
    let key = API_SECRET
    let signature = crypto.createHmac('sha256', key).update(stringHash).digest('hex')

    let options = {
      uri: `https://sandbox.bca.co.id/va/payments?CompanyCode=${requestBody.CompanyCode}&RequestID=${requestBody.RequestID}`,
      method: 'GET',
      headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
          'X-BCA-Key': API_KEY,
          'Origin': 'https://sandbox.bca.co.id',
          'X-BCA-Timestamp': timeStamp,
          'X-BCA-Signature': signature
      },
      json: requestBody
    }

    request(options, function (error, response, body) {
      res.send(body);
    })
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;