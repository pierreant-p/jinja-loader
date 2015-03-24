'use strict';

var nunjucks = require( 'nunjucks' );
var loaderUtils = require( 'loader-utils' );

// Look for nested dependencies in the compiled template
var findNestedRequires = function ( source ) {

    // find nested templates --> env.getTemplate( 'someTemplate.jinja', callback )

    var templateReg = /env\.getTemplate\(\"(.*?)\"/g;
    var filterReg = /env\.getFilter\(\"require\"\)\.call\(context, \"(.*?)\"/g;
    var match,
        required = []; // list of already required resources

    var regexps = [ templateReg, filterReg ];

    regexps.forEach( function ( reg ) {

        while ( ( match = reg.exec( source ) ) ) {
            var templatePath = match[ 1 ];
            if ( required.indexOf( templatePath ) === -1 ) {
                required.push( templatePath );
            }
        }

    } );

    return required;
};


module.exports = function ( source, map ) {

    if ( this.cacheable ) this.cacheable();

    var query = loaderUtils.parseQuery( this.query );
    var root = query.root || '';

    // Name the template relatively to the `root`.
    var compiledTemplate = nunjucks.precompileString( source, {
        name: this.resourcePath.replace( root, '' )
    } );

    // Find template dependencides and add the corresponding requires in the output
    var requires = findNestedRequires( compiledTemplate ),
        prefix = '';
    requires.forEach( function ( requirePath ) {
        prefix += 'require("' + requirePath + '");\n';
    } );

    // return value
    var tpl = prefix + compiledTemplate;

    this.callback( null, tpl, map );
};
