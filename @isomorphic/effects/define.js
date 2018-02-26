
const ARROW_REG_EXP = /^([$A-Z_][0-9A-Z_$]*)\s+=>/i;
const hasOwnProperty = Object.prototype.hasOwnProperty;

const { getArguments: attrs } = require("generic-jsx");
const match = (string, rhs) =>
    typeof rhs === "string" ? string === rhs : rhs.test(string);


module.exports.define = function define(callback)
{
    const source = callback.toString();
    const matches = source.match(ARROW_REG_EXP);
    const name = [matches && matches[1] || "untitled"];

    const definitions = callback(update);
    const routes = Object.keys(definitions)
        .map(key => route(key.split(/\s*->\s*/), definitions[key]));

    return Object.defineProperty(update, "name", { value: name });

    function update(state, event, childUpdate, push)
    {
        const { status, children } = attrs(state);

        if (event.name !== "replace-child")
            return handle(routes, state, event, childUpdate, push, true);

        const { ref, child } = event;
        const index = children.findIndex(child => attrs(child).ref === ref);

        const updatedStatus = attrs(child).status;
        const currentStatus = attrs(children[index]).status;            
        const updatedChildren = children.slice();

        updatedChildren.splice(index, 1, child);

        const updated = <state children = { updatedChildren } />;
        const bubbled = { name: `#${ref}:${updatedStatus}`, timestamp:Date.now() };

        return handle(routes, updated, bubbled, childUpdate, push, false);
    }
}

module.exports.impossible = function(state, event)
{
    throw new Error(`It should be impossible to receive ${event.name} while ${state.name} is in ${attrs(state).status}`);
}

function handle(routes, state, event, childUpdate, push, required)
{
    const { status } = attrs(state);
    const handler = routes.find(route =>
        match(status, route[0]) &&
        match(event.name, route[1]));
//console.log(typeof handler, Object.keys(handler));
//console.log(handler + " for " + status + " " + event.name);
    if (!handler && !required)
        return state;

    if (!handler)
        throw new Error(`<${state.name}/> has no handler for event ` +
                        `"${event.name}" while in "${status}"`);

    const [_, __, update] = handler;

    if (typeof update === "string")
        return <state status = { update } />;

    return update(state, event, childUpdate, push);
}

function route([status, event], handler)
{
    const parse = string => (matches =>
        matches ? new RegExp(matches[1]) : string)
        (string.match(/^\/(.*)\/$/));
        
    return [parse(status), parse(event || ""), handler];
}