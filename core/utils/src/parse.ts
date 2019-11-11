import JSON5 from 'json5';

export function parseRe(key: string, value: any): any {
    if (typeof value === 'string' && /^\\?\/.*\/[gimsuy]*$/.test(value)) {
        const parts = /^(\\)?\/(.*)\/([gimsuy]*)$/.exec(value);
        //escape the regex, useful when you don't want the regex converted.
        if (parts[1] === '\\') {
            return value.substring(1);
        }
        if (parts.length === 4) {
            return new RegExp(parts[2], parts[3]);
        }
        return new RegExp(parts[2]);
    }
    return value;
}

export function parseValue(value: string): any {
    if (/^".*"$/.test(value)) {
        return JSON5.parse(value, parseRe)
    }
    if (/^(true|false)$/.test(value)) {
        return JSON5.parse(value);
    }
    if (/^\\?\/.*\/[gim]*$/.test(value)) {
        const parts = value.split(/^(\\)?\/(.*)\/([gimsuy]*)$/);
        if (parts[1] === '\\') {
            return value.substring(1);
        }
        const re = parts[2];
        const mod = parts[3];
        if (mod) {
            return new RegExp(re, mod);
        }
        return new RegExp(re);
    }
    if (/^\d+?(?:\.\d*)?$/.test(value)) {
        return JSON5.parse(value);
    }
    if (/^\[([^{}\[\]]*)\]$/.test(value)) {
        return value.replace(/^\[(.*)\]$/, '$1')
            .split(/,\s*/)
            .filter(Boolean)
            .map(parseValue);

    }
    if (/^\{(.*)\}$/.test(value)) {
        return JSON5.parse(value, parseRe);

    }
    return JSON5.parse(`"${value}"`, parseRe);
}

export function stringify(value: any, indent = 2): string {
    return JSON.stringify(value, function (key, value) {
        if (value instanceof RegExp) {
            return value.toString();
        }
        return value;
    }, indent);
}

