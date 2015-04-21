var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
//input a list of ids or bruteforce it
var input = [];
var start = 1414335905;
var tries = 10000;
var delay = 1000;
var matches = 0;
var hits = 0;
//var proxies = [null,"http://120.237.30.178:5050","http://120.237.30.178:8888","http://124.91.135.152:8118", "http://210.101.131.227:8080", "http://119.6.144.74:81", "http://183.203.208.174:8118"];
var proxies = [null];
var rr = -1;

//guess a list
for (var i = 0; i < tries; i++) {
    input.push(start + i);
}
processList(input);

//build a list
//buildInput(1);

function buildInput(page) {
    rr = (rr + 1) % proxies.length;
    request.get({
        url: process.env.REMOTE + "/matches?page=" + page,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        },
        proxy: proxies[rr],
        timeout: 10000
    }, function(err, resp, body) {
        if (err) {
            return buildInput(page);
        }
        else if (resp.statusCode !== 200) {
            console.log(resp.statusCode);
        }
        else {
            $ = cheerio.load(body);
            var matches = $('td:first-child > a');
            //console.log(matches);
            var input = [];
            matches.each(function(i) {
                var match_url = $(this).attr('href');
                var id = Number(match_url.split(/[/]+/).pop());
                input.push(id);
            });
            processList(input, function() {
                //recursively call
                buildInput(page + 1);
            });
        }
    });
}

function processList(input, cb) {
    async.eachLimit(input, proxies.length, function(input, cb) {
        rr = (rr + 1) % proxies.length;
        setTimeout(function() {
            request.get({
                url: process.env.REMOTE + "/matches/" + input,
                headers: {
                    'User-Agent': 'request'
                },
                proxy: proxies[rr],
                timeout: 10000
            }, function(err, resp, body) {
                if (err) {
                    return cb();
                }
                else if (resp.statusCode !== 200) {
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
                console.log("matches: %s, hits: %s, percent: %s", matches, hits, (hits / matches));
                cb();
            });
        }, delay);
    }, function(err) {
        //done with list
        if (err) {
            console.log(err);
        }
        cb(err);
    });
}