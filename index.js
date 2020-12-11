const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('request');

var list = {};

function escapeMarkdown(text) {
    var unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
    var escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1'); // escape *, _, `, ~, \
    return escaped;
  }

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    const msgString = msg.content;
    console.log(msg);
    if (msgString.includes('guru who is your creator?')){
        msg.reply(escapeMarkdown("My lord and master <@!509591268087562260>"));
    } else if (msgString.includes('guru what is your purpose?')){
        msg.reply("I help you select movies...");
    } else if (msgString.includes('guru search')) {
        const searchQuery = msgString.replace("guru search ", "").trim();

        if (searchQuery != "") {
            searchMovie(searchQuery, msg);
        }
    } else if (msgString.includes('guru add')) {
        const idstr = msgString.replace("guru add ", "").trim();
        const id = parseInt(idstr);

        if (id != null) {
            list[id] = 0;
            addedResponse(id, msg);
        }
    } else if (msgString.includes('guru list likes')) {
        Object.keys(list).forEach(function(key) {
            getMovie(key, msg, true);
        });
    } else if (msgString.includes('guru list')) {
        Object.keys(list).forEach(function(key) {
            getMovie(key, msg);
        });
    } else if (msgString.includes('guru like')) {
        const idstr = msgString.replace("guru like ", "").trim();
        const id = parseInt(idstr);

        if (id != null) {
            if (list.hasOwnProperty(id)) {
                list[id] += 1
                likeResponse(id, msg)
            }
        }
    } else if (msgString.includes('guru unlike')) {
        const idstr = msgString.replace("guru unlike ", "").trim();
        const id = parseInt(idstr);

        if (id != null) {
            if (list.hasOwnProperty(id)) {
                list[id] -= 1
            }
        }
    }
});

client.login('Nzg2NzI0MTc4NjYwNTU2ODAx.X9Kj_A.0R2bO5HF-0NgJADc0JG0C7nS16U');

function searchMovie(query, msg) {
    request(encodeURI('https://api.themoviedb.org/3/search/movie?api_key=4cb1eeab94f45affe2536f2c684a5c9e&query=' + query), function (error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);

        const jsonObj = JSON.parse(body);
        const results = jsonObj["results"];

        var count = 0;
        var first = null;

        results.forEach(element => {
            if (count < 3) {
                first = element;
                count += 1;
                msg.channel.send(printableObj(element), {files: [posterUrl(element)]});
            }
        });

        return first;
    });
}

function getMovie(id, msg, noPic) {
    request(encodeURI('https://api.themoviedb.org/3/movie/' + id + '?api_key=4cb1eeab94f45affe2536f2c684a5c9e&append_to_response=credits'), function (error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);

        const jsonObj = JSON.parse(body);
        if (noPic) {
            msg.channel.send(printableObj(jsonObj, list[id]));
        } else {
            msg.channel.send(printableObj(jsonObj, list[id]), {files: [posterUrl(jsonObj)]});
        }
    });
}

function addedResponse(id, msg) {
    request(encodeURI('https://api.themoviedb.org/3/movie/' + id + '?api_key=4cb1eeab94f45affe2536f2c684a5c9e&append_to_response=credits'), function (error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);

        const jsonObj = JSON.parse(body);
        msg.reply("Added \"" + jsonObj.title + "\" to the list.")
    });
}

function likeResponse(id, msg) {
    request(encodeURI('https://api.themoviedb.org/3/movie/' + id + '?api_key=4cb1eeab94f45affe2536f2c684a5c9e&append_to_response=credits'), function (error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);

        const jsonObj = JSON.parse(body);
        msg.reply("Like for movie: \"" + jsonObj.title + "\"")
    });
}

function printableObj(obj, likes) {
    str = obj.id
    str += "\n"
    str += obj.title

    if (likes != null) {
        str += "\nLikes: " + likes;
    }

    str += "\n"
    str += obj.overview

    return str
}

function posterUrl(obj) {
    return "https://image.tmdb.org/t/p/original" + obj.poster_path + "?api_key=4cb1eeab94f45affe2536f2c684a5c9e"
}