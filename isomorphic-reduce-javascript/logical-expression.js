const { is } = require("@algebraic/type");
const reduce = require(".");
const { Value, isPureCoercableToBoolean } = require("./value");
const { PureNode } = require("./node-type");
const truthy = value => isPureCoercableToBoolean(value) && !!value;
const falsey = value => isPureCoercableToBoolean(value) && !value;


module.exports.LogicalExpression = function LogicalExpression(node)
{
    const { operator } = node;
    const shortCircuit =
        operator === "&&" ? falsey :
        operator === "||" ? truthy :
        operator === "??" ? isNotNull :
        unreachable();
    const { left, right } = node;
    const left_ = reduce(left);
    const leftValue = Value.from(left_);

    // [false] && _ => false
    // [true] || _  => true
    // [!null] ?? _ => !null
    // It doesn't matter if _ is pure due to short-circuiting.
    if (shortCircuit(leftValue))
        return left_;

    const right_ = reduce(right);
    const rightValue = Value.from(right_);
    const drop =
        operator === "&&" ? truthy :
        operator === "||" ? falsey :
        operator === "??" ? nullary :
        unreachable();

    // [true] && _  => _
    // [false] || _ => _
    // [null] ?? _  => _
    // We can only drop if it's pure.
    if (is(PureNode, left_) && drop(leftValue))
        return right_;

    // _ && [true]  => _
    // _ || [false] => _
    // _ ?? [null]  => _
    // We can only drop if it's pure.
    if (is(PureNode, right_) && drop(rightValue))
        return left_;

    // At this point we know we must include left_ and right_.
    const value =
        operator === "&&" ?
            truthy(left_) ? rightValue :
            falsey(left_) ? leftValue :
            falsey(right_) ? Value.Indefinite.Falsey :
            Unknown :
        operator === "||" ?
            truthy(left_) ? leftValue :
            falsey(left_) ? rightValue :
            truthy(right_) ? Value.Indefinite.Truthy :
            Unknown :
        operator === "??" ?
            notNullary(left_) ? leftValue :
            nullary(left_) ? rightValue :
            notNullary(right_) ? Value.Indefinite.Truthy :
            Unknown :
        unreachable();

    const newNode =
        left_ === left && right_ === right ?
            node :
            { ...node, left: left_, right: right_ };

    return Value.on(newNode, value);
}
