export class DoubleTags {
  constructor() {
    this._tags = ["{{", "}}"];
    this._partials = {};
    this._functions = {
      upper: (str) => String(str).toUpperCase(),
      lower: (str) => String(str).toLowerCase(),
      capitalize: (str) => {
        str = String(str);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      escape: (str) => {
        if (/[&<>"']/.test(String(str))) {
          return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        } else {
          return str;
        }
      },
    };
    this._escapeByDefault = false;
  }

  #renderWithCache(template, view) {
    const cache = new Map();

    const renderTemplate = (tpl, context) => {
      if (cache.has(tpl)) {
        return cache.get(tpl);
      }

      let result = this.#processSections(tpl, context);

      const regex = this.#getRegex();
      result = result.replace(regex, (match, content) => {
        // Partials
        if (content.startsWith(">")) {
          const partialName = content.slice(1).trim();
          const partialTemplate = this._partials[partialName];
          if (partialTemplate) {
            return renderTemplate(partialTemplate, context);
          }
          return `{{>${partialName}}}`;
        }
        // Regular variables
        return this.#processVariable(content, context);
      });

      cache.set(tpl, result);
      return result;
    };

    return renderTemplate(template, view);
  }

  #processSections(template, view) {
    const sectionRegex = this.#getSectionRegex();
    return template.replace(sectionRegex, (match, sectionName, content) => {
      return this.#processSection(sectionName, content, view);
    });
  }

  #processSection(sectionName, content, view) {
    const value = this.#lookup(view, sectionName);

    const [mainContent, elseContent] = this.#splitElseContent(content);

    let result = "";

    if (Array.isArray(value)) {
      // Arrays
      result += value
        .map((item) => {
          const itemContext = { ...view, ...item, ".": item };
          return this.#renderWithCache(mainContent, itemContext);
        })
        .join("");
    } else if (value) {
      // Truthy
      const newContext =
        typeof value === "object"
          ? { ...view, ...value, ".": value }
          : { ...view, [sectionName]: value, ".": value };
      result += this.#renderWithCache(mainContent, newContext);
    } else if (elseContent) {
      // @else
      result += this.#renderWithCache(elseContent, view);
    }

    return result;
  }

  #splitElseContent(content) {
    const elseRegex = new RegExp(
      this.#escapeRegExp(this._tags[0]) +
        "\\s*@else\\s*" +
        this.#escapeRegExp(this._tags[1]),
    );
    const parts = content.split(elseRegex);

    return parts.length > 1 ? [parts[0], parts[1]] : [content, null];
  }

  #processVariable(content, view) {
    const parts = content.split("|").map((part) => part.trim());
    let value = this.#lookup(view, parts[0]);

    for (let i = 1; i < parts.length; i++) {
      const [funcName, ...args] = parts[i].split(" ");
      if (this._functions[funcName]) {
        value = this._functions[funcName](value, ...args);
      } else {
        console.warn(`[DoubleTags] Function "${funcName}" not found`);
      }
    }

    if (this._escapeByDefault) {
      value = this._functions.escape(value);
    }

    return value != null ? value : "";
  }

  #lookup(obj, key) {
    if (key === ".") return obj;
    const keys = key.split(".");
    let value = obj;
    for (let k of keys) {
      if (value == null) {
        return "";
      }
      if (k === "") {
        continue;
      }
      if (Array.isArray(value) && !isNaN(parseInt(k))) {
        value = value[parseInt(k)];
      } else if (typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return "";
      }
    }
    return typeof value === "function" ? value.call(obj) : value ?? "";
  }

  #escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  #getRegex() {
    return new RegExp(
      this.#escapeRegExp(this._tags[0]) +
        "\\s*(.+?)\\s*" +
        this.#escapeRegExp(this._tags[1]),
      "g",
    );
  }

  #getSectionRegex() {
    return new RegExp(
      this.#escapeRegExp(this._tags[0]) +
        "\\s*#" +
        "(.+?)" +
        "\\s*" +
        this.#escapeRegExp(this._tags[1]) +
        "([\\s\\S]*?)" +
        this.#escapeRegExp(this._tags[0]) +
        "\\s*/" +
        "\\1" +
        "\\s*" +
        this.#escapeRegExp(this._tags[1]),
      "g",
    );
  }

  render(template, view, partials = {}) {
    try {
      this._partials = { ...this._partials, ...partials };
      return this.#renderWithCache(template, view);
    } catch (error) {
      console.error("[DoubleTags] Error in render:", error);
      return "";
    }
  }

  setTags(opening, closing) {
    this._tags = [opening, closing];
  }

  createPartial(name, template) {
    this._partials[name] = template;
  }

  createFunction(name, func) {
    this._functions[name] = func;
  }

  escapeByDefault() {
    this._escapeByDefault = true;
  }

  extractSection(template, sectionPath) {
    const sectionNames = Array.isArray(sectionPath)
      ? sectionPath
      : sectionPath.split(".");
    const sectionRegex = this.#getSectionRegex();
    const currentSection = sectionNames[0];

    let match;
    sectionRegex.lastIndex = 0;

    while ((match = sectionRegex.exec(template)) !== null) {
      if (match[1] === currentSection) {
        const content = match[2];

        if (sectionNames.length === 1) {
          return content.trim();
        } else {
          return this.extractSection(content, sectionNames.slice(1));
        }
      }
    }

    return null;
  }
}
