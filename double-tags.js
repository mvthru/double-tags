export class DoubleTags {
  constructor() {
    this.tags = ["{{", "}}"];
    this.partials = {};
    this.functions = {
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

  render(template, view, partials = {}) {
    try {
      this.partials = { ...this.partials, ...partials };

      const regex = this.#getRegex();
      const sectionRegex = this.#getSectionRegex();

      return this.#renderWithCache(template, view, regex, sectionRegex);
    } catch (error) {
      console.error("[DoubleTags] Error in render:", error);
      return "";
    }
  }

  #renderWithCache(template, view, regex, sectionRegex) {
    const cache = new Map();

    const renderTemplate = (tpl, context) => {
      if (cache.has(tpl)) {
        return cache.get(tpl);
      }

      let result = tpl;

      // Escape All HTML (disabled by default)
      if (this.escapeByDefault) {
        result = this.functions.escape(result);
      }

      // Process partials
      result = result.replace(sectionRegex, (match, sectionName, content) => {
        return this.#processSection(sectionName, content, context);
      });

      // Process variables
      result = result.replace(regex, (match, content) => {
        if (content.startsWith(">")) {
          const partialName = content.slice(1).trim();
          const partialTemplate = this.partials[partialName];
          if (partialTemplate) {
            return renderTemplate(partialTemplate, context);
          }
          return `{{>${partialName}}}`;
        }
        return this.#processVariable(content, context);
      });

      cache.set(tpl, result);
      return result;
    };

    return renderTemplate(template, view);
  }

  #processSection(sectionName, content, view) {
    let result = "";
    const value = this.#lookup(view, sectionName);

    if (Array.isArray(value)) {
      result += value
        .map((item) => {
          const itemContext = { ...view, ...item };
          return this.render(content, itemContext);
        })
        .join("");
    } else if (value) {
      result += this.render(content, {
        ...view,
        [sectionName]: value,
      });
    }

    return result;
  }

  #processVariable(content, view) {
    const parts = content.split("|").map((part) => part.trim());
    let value = this.#lookup(view, parts[0]);

    for (let i = 1; i < parts.length; i++) {
      const [funcName, ...args] = parts[i].split(" ");
      if (this.functions[funcName]) {
        value = this.functions[funcName](value, ...args);
      } else {
        console.warn(`[DoubleTags] Function "${funcName}" not found`);
      }
    }
    return value;
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
      this.#escapeRegExp(this.tags[0]) +
        "\\s*(.+?)\\s*" +
        this.#escapeRegExp(this.tags[1]),
      "g",
    );
  }

  #getSectionRegex() {
    return new RegExp(
      this.#escapeRegExp(this.tags[0]) + // {{
        "\\s*#" +
        "(.+?)" + // Captures the section name
        "\\s*" +
        this.#escapeRegExp(this.tags[1]) + // }}
        "([\\s\\S]*?)" + // Non-greedy match of content in between
        this.#escapeRegExp(this.tags[0]) + // {{
        "\\s*/" + // Matches /
        "\\s*" +
        "\\1" + // Matches the same section name
        "\\s*" +
        this.#escapeRegExp(this.tags[1]), // }}
      "g",
    );
  }

  setTags(opening, closing) {
    this.tags = [opening, closing];
  }

  createPartial(name, template) {
    this.partials[name] = template;
  }

  createFunction(name, func) {
    this.functions[name] = func;
  }

  escapeByDefault() {
    this._escapeByDefault = true;
  }
}
