const { join, sep, dirname } = require("path");
const { Metadata } = require("./babel-plugin-metadata");


module.exports = function ({ types: t })
{
    return { visitor: { CallExpression } };

    function CallExpression(path, state)
    {
        const { node } = path;

        if (!t.isIdentifier(node.callee, { name: "require" }))
            return;

        if (node.arguments.length > 1)
            return;

        const argument = node.arguments[0];

        if (!t.isStringLiteral(argument))
            return;

        const unresolved = argument.value;
        const metadata = state.file.metadata;
        const previous = metadata.dependencies.valueSeq()
            .findIndex(dependency => dependency === unresolved);
        const index = previous > -1 ? previous : metadata.dependencies.size;

        if (previous <= -1)
        {console.log("ADDING " + unresolved);
            const dependencies = metadata.dependencies.add(unresolved);

            state.file.metadata = Metadata({ ...metadata, dependencies });
        }

        path.replaceWith({ ...node, arguments: [t.numericLiteral(index)] });
    };
}


