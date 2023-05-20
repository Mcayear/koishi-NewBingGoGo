// 配置文件部分
const fs = require('fs');
const { origin } = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log("worker域名："+origin);

// 
const WebSocket = require('ws');
const https = require('https');
const ChatOptionsSets = require('./mydev/ChatOptionsSets.js');
const SendMessageManager = require('./mydev/SendMessageManager.js');

var bingChatWs, msgManager;

function start() {
    const options = {
        hostname: origin,
        port: 443,
        path: '/turing/conversation/create',
        method: 'GET',
        headers: {
            "new_bing_go_go-plug-create": true
        }
    };
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            console.log('状态码:', res.statusCode);
            let data = [];
            res.on('data', chunk => {
              data.push(chunk);
            });
            res.on('end', () => {
                try{
                    resolve(JSON.parse(data));
                } catch (err) {
                    console.error(err)
                }
            });
        });

        req.on('error', err => {
            reject(err);
        });
        req.end();
    });
}

start().then((resjson)=>{
    bingChatWs = new WebSocket('wss://'+origin+'/sydney/ChatHub');
    bingChatWs.on('error', console.error);
    bingChatWs.on('open', function open() {
        console.log(JSON.stringify(resjson, null, 4));
        msgManager = new SendMessageManager({chatOptionsSets: new ChatOptionsSets()}, resjson.conversationId, resjson.clientId, resjson.conversationSignature, "Creative", undefined);
        msgManager.sendShakeHandsJson(bingChatWs);
        msgManager.sendChatMessage(bingChatWs, "你好");
    });
    
    bingChatWs.on('message', function message(data) {
      console.log(data.toString());
    });
});