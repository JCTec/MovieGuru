const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('request');
require('dotenv').config();
const API_KEY = process.env.API_KEY || "";
const API_KEY_MOVIE = process.env.API_KEY_MOVIE || "";

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
        const id = parseInt(idstr) || -1;

        console.log(id);

        if (id != -1) {
            list[id] = 0;
            addedResponse(id, msg);
        } else {
            console.log("Searching");
            searchAndGetMovie(idstr, msg).then((movie) => {
                console.log(movie);

                if (!list.hasOwnProperty(movie.id)) {
                    list[movie.id] = 0
                    msg.reply("Added \"" + movie.title + "\" to the list, use guru like to vote for it.")
                } else {
                    msg.reply("Already added \"" + movie.title + "\" to the list, use guru like to vote for it.")
                }
            })
        }
    } else if (msgString.includes('guru list likes')) {
        Object.keys(list).sort(compare).forEach(function(key) {
            getMovie(key, msg, true);
        });
    } else if (msgString.includes('guru list first')) {
        if (Object.keys(list).length > 0) {
            getMovie(Object.keys(list).sort(compare)[0], msg);
        }
    } else if (msgString.includes('guru list random')) {
        if (Object.keys(list).length > 0) {
            const key = between(0, Object.keys(list).length);
            getMovie(Object.keys(list).sort(compare)[key], msg);
        }
    } else if (msgString.includes('guru list')) {
        Object.keys(list).sort(compare).forEach(function(key) {
            getMovie(key, msg);
        });
    } else if (msgString.includes('guru like')) {
        const idstr = msgString.replace("guru like ", "").trim();
        const id = parseInt(idstr) || -1;

        if (id != -1) {
            if (list.hasOwnProperty(id)) {
                list[id] += 1
                likeResponse(id, msg)
            }
        } else {
            console.log("Liking search movie");
            console.log(idstr);
            searchAndGetMovie(idstr, msg).then((movie) => {

                if (list.hasOwnProperty(movie.id)) {
                    list[movie.id] += 1
                    msg.reply("Like for movie: \"" + movie.title + "\"")
                } else {
                    list[movie.id] = 1
                    msg.reply("Added to the list and like for movie: \"" + movie.title + "\"")
                }

                msg.channel.send(printableObj(movie), {files: [posterUrl(movie)]});
            })
        }
    } else if (msgString.includes('guru unlike')) {
        const idstr = msgString.replace("guru unlike ", "").trim();
        const id = parseInt(idstr) || -1;

        if (id != -1) {
            if (list.hasOwnProperty(id)) {
                list[id] -= 1
            }
        } else {
            searchAndGetMovie(idstr, msg).then((movie) => {
                if (list.hasOwnProperty(movie.id)) {
                    list[id] -= 1
                    msg.reply("Remove like for movie: \"" + movie.title + "\"")
                } else {
                    msg.reply("Couldn't find that movie. 🥲")
                }
            })
        }
    } else if (msgString.includes('guru remove')) {
        const idstr = msgString.replace("guru remove ", "").trim();
        const id = parseInt(idstr) || -1;

        if (id != -1) {
            if (list.hasOwnProperty(id)) {
                delete list[id]
            }
        } else {
            searchAndGetMovie(idstr, msg).then((movie) => {
                if (list.hasOwnProperty(movie.id)) {
                    delete list[id]
                } else {
                    msg.reply("Couldn't find that movie. 🥲")
                }
            })
        }
    }
});

client.login(API_KEY);

function compare(a, b) {
    return list[a] < list[b]
}

function searchAndGetMovie(query, msg) {
    let promise = new Promise(function(resolve, reject) {
        const url = encodeURI('https://api.themoviedb.org/3/search/movie?api_key=' + API_KEY_MOVIE + '&query=' + query);
        console.log(url);

        request(url, function (error, response, body) {
            console.error('error:', error);
            console.log('statusCode:', response && response.statusCode);
    
            const jsonObj = JSON.parse(body);
            const results = jsonObj["results"];

            var resolved = false;

            for (const element in results) {
                if (!resolved) {
                    resolved = true;
                    resolve(results[element]);
                }
            }
        });
    });

    return promise
}

function searchMovie(query, msg) {
    request(encodeURI('https://api.themoviedb.org/3/search/movie?api_key=' + API_KEY_MOVIE + '&query=' + query), function (error, response, body) {
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

function getMovieWith(id, msg) {
    let promise = new Promise(function(resolve, reject) {
        request(encodeURI('https://api.themoviedb.org/3/movie/' + id + '?api_key=' + API_KEY_MOVIE + '&append_to_response=credits'), function (error, response, body) {
            console.error('error:', error);
            console.log('statusCode:', response && response.statusCode);
    
            const jsonObj = JSON.parse(body);

            resolve(jsonObj);
        });
    });

    return promise
}

function getMovie(id, msg, noPic) {
    const uri = encodeURI('https://api.themoviedb.org/3/movie/' + id + '?api_key=' + API_KEY_MOVIE + '&append_to_response=credits');

    request(uri, function (error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);
        console.log(uri);

        const jsonObj = JSON.parse(body);

        console.log(jsonObj);

        if (noPic) {
            msg.channel.send(printableObj(jsonObj, list[id]));
        } else {
            msg.channel.send(printableObj(jsonObj, list[id]), {files: [posterUrl(jsonObj)]});
        }
    });
}

function addedResponse(id, msg) {
    request(encodeURI('https://api.themoviedb.org/3/movie/' + id + '?api_key=' + API_KEY_MOVIE + '&append_to_response=credits'), function (error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);

        const jsonObj = JSON.parse(body);
        msg.reply("Added \"" + jsonObj.title + "\" to the list.")
    });
}

function likeResponse(id, msg) {
    request(encodeURI('https://api.themoviedb.org/3/movie/' + id + '?api_key=' + API_KEY_MOVIE + '&append_to_response=credits'), function (error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);

        const jsonObj = JSON.parse(body);
        msg.reply("Like for movie: \"" + jsonObj.title + "\"")
    });
}

function printableObj(obj, likes) {
    str = obj.id
    str += ": "
    str += obj.title

    if (likes != null) {
        str += "\n"
        str += "Likes: " + likes;
    } else {
        str += "\n"
        str += obj.overview
    }

    return str
}

function posterUrl(obj) {
    return "https://image.tmdb.org/t/p/original" + obj.poster_path + "?api_key=" + API_KEY_MOVIE
}

function between(min, max) {  
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }