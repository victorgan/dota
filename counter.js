var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
//input a list of ids or bruteforce it
var input = [];
var start = 1320663585;
var tries = 10000;
var matches = 0;
var hits = 0;
for (var i = 0; i < tries; i++) {
    input.push(start + i);
}
//var proxies = [null,"http://120.237.30.178:5050","http://120.237.30.178:8888","http://124.91.135.152:8118", "http://210.101.131.227:8080", "http://119.6.144.74:81", "http://183.203.208.174:8118"];
var proxies = [null];
var rr = -1;
async.eachLimit(input, proxies.length, function(input, cb) {
    rr = (rr + 1) % proxies.length;
    setTimeout(function(){
         request.get({
        url: process.env.REMOTE + "/matches/" + input,
        headers: {
            'User-Agent': 'request'
        },
        proxy: proxies[rr],
        timeout: 10000
    }, function(err, resp, body) {
        if (err){
            return cb();
        }
        if (resp.statusCode !== 200) {
            console.log(resp.statusCode);
        }
        else {
            matches += 1;
            $ = cheerio.load(body);
            var hit = $.root().find(process.env.SELECTOR).length;
            //console.log(hit);
            if (hit) {
                console.log("input: %s hit", input);
                hits += 1;
            }
            else {
                console.log("input: %s miss", input);
            }
        }
        console.log("matches: %s, hits: %s, percent: %s", matches, hits, (hits / matches).toFixed(2));
        cb();
    });
    }, 2000);
}, function(err) {
    console.log(err);
});
