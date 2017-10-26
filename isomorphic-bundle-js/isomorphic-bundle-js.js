
const { extname } = require("path");

const resolvedPathsInKey = require("isomorphic-compile/resolved-paths-in-key");
const transform = require("isomorphic-compile/babel-transform");

const builtIn = require("./built-in");
const concatenate = require("./concatenate");
const { getArguments } = require("generic-jsx");


module.exports = function bundle({ entrypoint, cache, options, destination })
{
    return  <concatenate { ...{ entrypoint, destination } } >
                <dependencies { ...{ cache, options } } >
                    <dependency { ...{ path: entrypoint, cache, options } } />
                </dependencies>
            </concatenate>;
}

function dependencies({ children, visited, cache, options })
{
    const [resolved, subdependencies, updated] =
        resolvedPathsInKey(visited, "dependencies", children);

    if (subdependencies.size <= 0)
        return resolved;

    return  [
                resolved,
                <dependencies { ...{ visited: updated, cache, options } }>
                    { Array.from(subdependencies, path =>
                        <dependency { ...{ path, cache, options } } /> )
                    }
                </dependencies>
            ];
}

function dependency({ cache, path, options })
{
    if (builtIn.is(path))
        return <builtIn name = { path } />;

    if (extname(path) === ".json")
        return { include: path };

    return <transform { ...{ cache, options: options.babel, path } } />;
}