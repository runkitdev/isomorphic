const hasOwnProperty = Object.prototype.hasOwnProperty;
const ignoredDependencies = { "module": /^(?!path).*$/ };

const builtIns = ((builtIns, empty) =>
    (Object.keys(builtIns)
        .filter(key => !builtIns[key])
        .map(key => builtIns[key] = empty), builtIns))
    (Object.assign(
        Object.create(null),
        require("node-libs-browser"),
        { module: require.resolve("./built-in/module") }),
    require.resolve("node-libs-browser/mock/empty"));


module.exports = function polyfill(input)
{
    return  hasOwnProperty.call(builtIns, input) &&
            {
                input: builtIns[input],
                ignoredDependencies: ignoredDependencies[input]
            };
}