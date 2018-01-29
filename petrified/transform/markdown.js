const React = require("react");
const yaml = require("js-yaml");

const cm = require("./common-mark");
const render = require("./react-element");



module.exports = function markdown({ contents, metadata, options })
{
    const { frontmatter, markdown } = split(contents);
    const { components } = options;

    // React children.
    const children = cm.render({ markdown, components: components.markdown });
    const { component, ...props } = { ...metadata, ...frontmatter };

    if (!component)
        throw new Error("Cannot render markdown file without a layout component.");

    const Component = components[component]();
    const markup = render(React.createElement(Component, props, children));

    return { contents: markup, metadata: { frontmatter, destination: options.destination } };
}

module.exports.extensions = new Set(["markdown", "md"]);

function split(text)
{
    const lines = text.split("\n");
    const fence = line => line === "---";

    if (!fence(lines[0]))
        return { frontmatter: { }, markdown: text };

    const closing = lines.findIndex((line, index) => fence(line) && index > 0);

    if (closing === -1)
        throw new Error("Unterminated frontmatter region. File needs a matching ---.");

    const markdown = lines.slice(closing + 1).join("\n");
    const frontmatter = yaml.safeLoad(lines.slice(1, closing).join("\n"));

    return { markdown, frontmatter }; 
}
