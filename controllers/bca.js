const fetch = require("node-fetch");

const request = require("request");
const crypto = require("crypto");
const axios = require('axios')

const { bca, businessBanking } = require("./credentials");
const { format, isAfter, addSeconds } = require("date-fns");
const url = require("url");
const util = require("lodash");
const defaultTimestampFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
let token;

console.log(bca.api_host);

const getToken = () => {
    axios({
        method: 'post',
        url: `${bca.api_host}/api/oauth/token`,
        headers: {
            Authorization: `Basic ${Buffer.from(`${bca.client_id}:${bca.client_secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
            'grant_type': 'client_credentials'
        }
    })
    .then((result) => {
        console.log("ini result ==>",result)
    }).catch((err) => {
        console.log("error ===> ",err)
    });
}

const getToken1 = (req, res) => {
    let url = `${bca.api_host}/api/oauth/token`
    fetch(url, {
        method: 'post',
        headers: {
            Authorization: `Basic ${Buffer.from(`${bca.client_id}:${bca.client_secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=client_credentials`
    })
    .then(function(response) {
        console.log('RESPONSE BOS', response)
        res.status(200).json({
            message: 'success',
            data: response
        })
    })
    .catch(function(err) {
        console.log('ERROR BOS', err)
        res.status(400).json({
            message: err.message
        })
    })
}

module.exports = { getToken, getToken1 }
