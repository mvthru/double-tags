## Double Tags
[![Release NPM Package](https://github.com/mvthru/double-tags/actions/workflows/release-package.yml/badge.svg)](https://github.com/mvthru/double-tags/actions/workflows/release-package.yml)
![NPM Version](https://img.shields.io/npm/v/double-tags)
![NPM Downloads](https://img.shields.io/npm/dw/double-tags)

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

### Tags

#### Functions
Alongside custom functions, Double Tags also has a small handful of built-in functions, you can call functions by appending `| function var1 var2 ect.` to your variable. Eg. `{{ img_src | img 800 }}` calls a custom `img` function, with `800` as the first (and only) variable.

##### Built-in Functions
`upper` - Converts variable to uppercase.

`lower` - Converts variable to lowercase.

`capitalize` - Capitalizes first char. of variable.

`escape` - Escapes HTML characters.

#### Loops
If the JSON you pass to Double Tags contains an array of objects, you can loop over this. A special `{{@index}}` tag is also available inside of loops, to return the current item index.

🙋 Nested loops are not currently supported.

````js
{{#store.settings.navigation}}
  <li key="{{@index}}" style="font-weight: 600">
    <a class="press" href="{{path}}">{{label}}</a>
  </li>
{{/store.settings.navigation}}
````
