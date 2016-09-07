'use strict';

var nunjucks = require('nunjucks');
var loaderUtils = require('loader-utils');
var env, root;


var findNestedTemplates = function(source) {

    var templateReg = /env\.getTemplate\(\"(.*?)\"/g,
        match,
        required = []; // list of already required resources

    while ((match = templateReg.exec(source))) {
        var requiredPath = match[1];
        if (required.indexOf(requiredPath) === -1) {
            required.push(requiredPath);
        }
    }

    return required;
};


module.exports = function(source, map) {

    if (this.cacheable) this.cacheable();

    if (!env) {
        var query = loaderUtils.parseQuery(this.query);
        root = query.root || '';

        env = new nunjucks.Environment(new nunjucks.FileSystemLoader(root));
        if (query.config) {
            var config = require(query.config);
            config(env);
        }
    }

    // Name the template relatively to the `root`.
    var compiledTemplate = nunjucks.precompileString(source, {
        name: this.resourcePath.replace(root, ''),
        env: env
    });

    // Find template dependenciees and add the corresponding requires in the output
    var requires = findNestedTemplates(compiledTemplate),
        prefix = '';
    requires.forEach(function(requirePath) {
        prefix += 'require("' + requirePath + '");\n';
    });

    // Replace 'require' filter by a javascript require expression
    var filterReg = /env\.getFilter\(\"require\"\)\.call\(context, \"(.*?)\"/g;
    compiledTemplate = compiledTemplate.replace(filterReg, 'require("$1"');

    // return value
    var tpl = prefix + compiledTemplate;

    this.callback(null, tpl, map);
};
