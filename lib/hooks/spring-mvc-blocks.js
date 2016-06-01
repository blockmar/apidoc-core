var _    = require('lodash');
var path = require('path');

var rewriteVariables = function (url){
    return url.replace(/\{/g, ':').replace(/}/g, '');
};

var stripVersion = function(url) {
    if(!url) {
        return "";
    }
    return url.replace(/\/v([0-9]+|\*)/, '');
};

var normalize = function(base, url) {
    var result = [];
    base = base ? base.replace(/"/g, '') : "";
    if(url.indexOf('"/') == 0) {
        result.push(stripVersion(base + url.replace(/"/g, '')));
    } else {
        url.split(',').forEach(function(part) {
            part = part.replace(/value|= {|={|=|\s|"|}/g, '');
            if(part.indexOf('RequestMethod') < 0) {
                result.push(stripVersion(base + part));
            }
        });
    }
    return result.length == 0 ? [ "" ] : _.uniq(result);
};
    
exports.findBlocks = function(parent, src) {
    if (parent.extension != '.java') {
        return [];
    }

    var clazz = path.basename(parent.filename, parent.extension);

    var base,
        matches,
        mapping = [];

    src = src.replace(/@Controller\(([^)]+)\)/, '@Controller');

    var javaControllerRegExp = /Controller\uffff@RequestMapping\((.+?)\)/g;
    matches = javaControllerRegExp.exec(src);
    while (matches) {
        base = matches[1];
        matches = javaControllerRegExp.exec(src);
    }

    if(base) {
        base = normalize("", base)[0];
    }

    var javaMethodRegExp = /\uffff\uffff(\s*?)@RequestMapping\((.+?)\)/g;
    matches = javaMethodRegExp.exec(src);
    while (matches) {
        normalize(base, matches[2]).forEach(function(url) {
            mapping.push(url);
        });
        matches = javaMethodRegExp.exec(src);
    }

    var blocks = [];

    if(mapping.length > 0) {
        mapping = _.uniq(mapping);
        for (var i = 0; i < mapping.length; i++) {
            var url = rewriteVariables(mapping[i]);
            blocks.push("@api {unknown} " + url + " Undocumented Call\n@apiName Undocumented" + i + "\n@apiGroup " + clazz.replace('Controller', ''));
        }
    }

    return blocks;
};