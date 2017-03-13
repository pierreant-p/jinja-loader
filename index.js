/* jshint -W097 */
/*globals require:false, module:false */
'use strict';

var nunjucks = require('nunjucks');
var loaderUtils = require('loader-utils');
var env;
var root;


var findNestedTemplates = function(source) {

    var templateReg = /env\.getTemplate\(\"(.*?)\"/g;
    var match;
    var required = []; // list of already required resources

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
        // Need to copy because options is read-only.
        // See note in https://github.com/webpack/loader-utils/
        var options = Object.assign(
            {
                root: ''
            },
            loaderUtils.getOptions(this)
        );
        options.root = options.root.slice();

        root = options.root || '';
        env = new nunjucks.Environment(new nunjucks.FileSystemLoader(root));
        // Handle additional configuration to the nunjucks environment
        if (options.config) {
            options.config(env);
        }
    }

    // Name the template relatively to the `root`.
    var compiledTemplate = nunjucks.precompileString(source, {
        name: this.resourcePath.replace(root, ''),
        env: env
    });

    // Find template dependenciees and add the corresponding requires in the output
    var requires = findNestedTemplates(compiledTemplate);
    var prefix = '';
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
