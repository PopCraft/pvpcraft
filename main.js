/**
 * Created by macdja38 on 2016-04-17.
 */

var Discord = require("discord.js");
var client = new Discord.Client({forceFetchUsers: true, autoReconnect: true});

var Configs = require("./lib/config.js");
console.log(Configs);
var config = new Configs("config");
var auth = new Configs("auth");

var key = auth.get("key", null);
if(key == "key") {
    key = null;
}

var now = require("performance-now");
var Parse = require("./lib/newParser.js");

var colors = require('colors');

var Permissions = require("./lib/permissions.js");
console.log(Permissions);
var perms = new Permissions(config);

var request = require('request');

var defaults = {
    "prefix": []
};

var hasBeenReady = false;

var moduleList = [];

var mention;
var name;
var id;

client.on('message', (msg)=> {
    if (msg.author.id === id) return;
    var t1 = now();
    var l;
    if (msg.channel.server) {
        l = config.get(msg.channel.server.id, defaults).prefix;
        if (l == null) {
            l = defaults.prefix;
        }
    } else {
        l = defaults.prefix;
    }
    var command = Parse.command(l, msg, {"allowMention": id, "botName": name});
    if (command) {
        console.log("value is".blue);
        for (var mod in moduleList) {
            //console.log(command.command);
            //console.log(moduleList[mod].commands);
            //console.log(moduleList[mod].commands.indexOf(command.command));
            if (moduleList[mod].commands.indexOf(command.commandnos) > -1) {
                try {
                    if (moduleList[mod].module.onCommand(msg, command, perms, l) === true) {
                        break;
                    }
                } catch (error) {
                    console.error(error);
                    console.error(error.stack);
                }
            }
        }
    }
    else {
        //apply misc responses.
        for (var mod in moduleList) {
            //console.log(command.command);
            //console.log(moduleList[mod].commands);
            //console.log(moduleList[mod].commands.indexOf(command.command));
            if (moduleList[mod].module.misc) {
                try {
                    if (moduleList[mod].module.misc(msg, perms, l) === true) {
                        break;
                    }
                } catch (error) {
                    console.error(error);
                    console.error(error.stack);
                }
            }
        }
    }
    var t2 = now();
    console.log(t2 - t1);
});

function reload() {
    defaults = config.get("default", {"prefix": ["!!", "//"]});
    console.log("defaults");
    console.log(defaults);
    name = client.user.name;
    for (var module of moduleList) {
        console.log(module);
        if(module.module) {
            if (module.module.onDisconnect) {
                console.log("Trying to Remove Listeners!".green);
                module.module.onDisconnect();
            }
        }
    }
    moduleList = [];
    var modules = config.get("modules");
    console.log(modules);
    for (var module in modules) {
        var Modul = require(modules[module]);
        var mod = new Modul(client, config);
        if(mod.onReady) mod.onReady();
        moduleList.push({"commands": mod.getCommands(), "module": mod});
    }
    console.log(moduleList);
}

client.on('error', (error)=>{
    console.error(error);
    console.error(error.stack);
});

client.on('disconnect', ()=>{
    console.log("Disconnect".red);
    for(var i in moduleList) {
        if(moduleList[i].module.onDisconnect) {
            moduleList[i].module.onDisconnect();
        }
    }
});

client.on('ready', ()=> {
    id = client.user.id;
    mention = "<@" + id + ">";
    name = client.user.name;
    reload();
    console.log("-------------------");
    console.log("Ready as " + client.user.username);
    console.log("Mention  " + mention);
    console.log("-------------------");
    if(!hasBeenReady) {
        hasBeenReady = true;
        setTimeout(updateCarbon, 3600000)
    }
});

client.loginWithToken(auth.get("token", {}), (error)=>{
    if(error) {
        console.error("Error logging in.");
        console.error(error);
        console.error(error.stack);
    }
});

client.on('serverCreated', ()=>{
    updateCarbon();
});

process.on('SIGINT', ()=> {
    setTimeout(() => {
        process.exit(1)
    }, 5000);
    console.log("Logging out.");
    client.logout(()=> {
        console.log("Bye");
        process.exit(0);
    });
});

function updateCarbon() {
    console.log("Attempting to update Carbon".green);
    if(key) {
        request(
            {
                url: 'https://www.carbonitex.net/discord/data/botdata.php',
                body: {key: key, servercount: client.servers.length},
                json: true
            },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                }
                else if (error) {
                    console.error(error);
                }
                else {
                    console.error("Bad request or other");
                    console.error(response.body);
                }
            }
        );
    }
}

function processM() {

}
