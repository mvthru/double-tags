## Double Tags
[![Release NPM Package](https://github.com/mvthru/double-tags/actions/workflows/release-package.yml/badge.svg)](https://github.com/mvthru/double-tags/actions/workflows/release-package.yml)
[![NPM Version](https://img.shields.io/npm/v/double-tags)](https://www.npmjs.com/package/double-tags)
[![NPM Downloads](https://img.shields.io/npm/dw/double-tags)](https://www.npmjs.com/package/double-tags)

Double Tags provides a quick and easy way to replace {{tags}} with something else in NodeJS.

*Just a quick heads up, Double Tags does not escape HTML by default. This is intentional, but can be changed by calling `doubleTags.escapeByDefault()` before any render functions.*

### Getting Started
````js
npm i double-tags
````

Alternatively, just drop the `double-tags.js` file into your project, and include like so:

````js
import { DoubleTags } from "[path_to_file]/double-tags.js";
````

Then initialize with:
````js
const doubleTags = new DoubleTags();
````

### Functions
#### Render
Arguably the core feature, rendering variables.

````js
const json = {store: {name: "Three Bean Stew", tagline: "Specialty Coffee"}}
const template = `<h1>{{store.name}}</h1>`

doubleTags.render(template, json)
````

#### Partials
Sometimes, you might want to introduce your template in sections and render all variables in one go, you can do that with partials.
````js
const products =`{{#store.settings.navigation}}
  <li key="{{@index}}" style="font-weight: 600">
    <a class="press" href="{{path}}">{{label}}</a>
  </li>
{{/store.settings.navigation}}`

doubleTags.createPartial("content", products);
````

You can reference it just like a normal tag, but with a `>` prepended to the tag name. Eg. `{{>content}}`.

#### Custom Fuctions
Functions enable you to extend variables. You can specify an un-capped number of variables, optionally perform some function, and then return the completed value.
````js
doubleTags.createFunction("img", (src, width) => `/image/${src}?width=${width}`);
````

#### Escape HTML by Default
````js
doubleTags.escapeByDefault()
````

#### Customize Opening/Closing Tags
````js
doubleTags.setTags("👉", "👈")
````

#### Extract Section
This might be a bit niche, but perhaps you want to perform some manipluation before rendering and need to extract a partiular section.
````js
doubleTags.extractSection("cart.items")
````

### Tags

#### Functions
Alongside custom functions, Double Tags also has a small handful of built-in functions, you can call functions by appending `| function var1 var2 ect.` to your variable. Eg. `{{ img_src | img 800 }}` calls a custom `img` function, with `800` as the first (and only) variable.

##### Built-in Functions
`upper` - Converts variable to uppercase.

`lower` - Converts variable to lowercase.

`capitalize` - Capitalizes first char. of variable.

`escape` - Escapes HTML characters.

#### Sections
Sometimes you want to do more with a variable. Maybe it's an array and you want to loop over it, or it's a boolean and you want to show one thing if it's true and another thing it's false. Sections help you achieve this. 

Sections have a couple of special tags, `{{@index}}` and `{{@else}}`, which are what they sound like, but more of them below.

##### Truthy
You want to display some content only when the variable is true or has content.

````js
{{#likes_pizza}}
  <p>This boi likes pizza.</p>
{{/likes_pizza}}
````

##### Truthy (with else)
You have a boolean variable and want to change the content based on if it's true or false, open up a section and use the `{{@else}}` tag. - Everything before the `{{@else}}` will be shown when the variable is true, and everything after when the variable is false.

````js
{{#likes_pizza}}
  <p>This boi likes pizza.</p>
  {{@else}}
  <p>This boi does NOT like pizza... 😧</p>
{{/likes_pizza}}
````

##### Loops
If you create a section from an array, each item will be rendered using the template between the opening/closing tags. - You can use the special `{{@index}}` tag available only within loops to return the current item's index.

🙋 Nested loops are not currently supported.

````js
{{#store.settings.navigation}}
  <li key="{{@index}}" style="font-weight: 600">
    <a class="press" href="{{path}}">{{label}}</a>
  </li>
{{/store.settings.navigation}}
````

#### Partials
If you've defined a partial, you can reference it just like a normal tag, but with a `>` prepended to the tag name. Eg. `{{>content}}`.
