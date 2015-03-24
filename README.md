# jinja2 / nunjucks loader for webpack

## Nunjucks

Require your nunjucks templates to precompile them.
They will be available in the global `window.nunjucksPrecompiled` object,
as per nunjucks-fashion.

``` javascript
require('./myTemplate.jinja');

...

var environment = new Nunjucks.Environment();
var template = environment.render('myTemplate.jinja');
```

Nested requires will be followed (extends, includes, ...)

You'll need to adapt your Nunjucks template loader, to accommodate for
the fact that your template might we avalaible after your instanciate your
environment.


``` javascript
    // The default WebLoader requires the precompiled templates to be available right
    // during the init method. Because we load some templates asynchronously, some templates
    // might be added to the `window` global after that.
    // To avoid this issue, we need a loader that checks the `window` object every time.
    var PrecompiledLoader = Nunjucks.Loader.extend( {

        getSource: function ( name ) {
            return {
                src: {
                    type: 'code',
                    obj: window.nunjucksPrecompiled[ name ]
                },
                path: name
            };
        }

    } );

    var environment = new Nunjucks.Environment( [
        new PrecompiledLoader()
    ] );
```

## Jinja2

If your render your jinja2/nunjucks template server-side, your might want to parse your
templates to find dependencies declared in your templates and have webpack generate a
module for them (images, css, svg ...).
You can do so using the `require` filter.


```
{{ 'myImage.png' | require }}
{{ 'myStyle.css' | require }}
```

You need to configure loaders for these filetypes too. (Take a look at the [file-loader](https://github.com/webpack/file-loader).)

To include the generated assets in your filter, create a custom filter in your backend. Eg in Python:

``` python
def require(path):
    assetmap = get_assetmap()  # retrieve the assetmap, for example using the [AssetMapPlugin](https://github.com/mtscout6/asset-map-webpack-plugin)

    try:
        return assetmap['assets'][path]
    except KeyError:
        raise Exception('Couldn\'t require asset {}'.format(path))
```

## Config

You can define the root path of your templates in the loader query in your webpack config.

```
...
module: {
    loaders: [ {
        // jinja/nunjucks templates
        test: /\.jinja$/,
        loader: 'jinja-loader',
        query: {
            root: /path/to/templates
        }
    } ]
}
...
```

## LICENSE

MIT (http://www.opensource.org/licenses/mit-license.php)
