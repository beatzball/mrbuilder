const toDocs = v => JSON.parse(JSON.stringify(v, function (key, value) {
    if (key === 'value' && this.type === 'instanceOf') {
        return value != null && (value.displayName || value.name
                                 || `[${typeof value}]`)
    }
    if (value instanceof RegExp) {
        return '' + value;
    }
    return value;
}));
//Object.keys causes issues with transform
const assign = function (target) {
    const reset = Array.prototype.slice.call(arguments, 1);

    function assign$each(key) {
        target[key] = this[key];
        return target;
    }

    return reset.reduce(function (ret, obj) {
        keys(obj).forEach(assign$each, obj);
        return ret;
    }, target || {});
};
const keys   = (obj) => {
    const ret = [];
    if (!obj) {
        return ret;
    }
    for (let k in obj) {
        if (has(obj, k)) {
            ret.push(k)
        }
    }
    return ret;
};
const has    = Function.call.bind(Object.prototype.hasOwnProperty);

const enumify     = v => ({
    value   : typeof v === 'number' || typeof v === 'function' ? '' + v
        : `'${v}'`,
    computed: false
});
const noUndefined = (obj) => {
    if (!obj) {
        return obj;
    }
    return keys(obj).reduce((ret, key) => {
        if (obj[key] === void(0)) {
            return ret;
        }
        ret[key] = obj[key];
        return ret;
    }, {});
};

const process  = (prop) => {
    if (prop == null) {
        return void(0);
    }
    if (typeof prop === 'string') {
        return prop;
    }
    const { type: name, value, required, description = void(0) } = prop;

    switch (name) {
        case 'shape':
            return {
                name,
                value: keys(value).reduce((ret, key) => {
                    ret[key] =
                        process(assign({}, { required: false }, value[key]));
                    return ret;
                }, {}),
            };
        case 'oneOf': {
            return {
                name : 'enum',
                value: value.map(enumify)
            }
        }
        case 'instanceOf':
            return noUndefined({ name, value, required, description });
        case 'oneOfType':
            return {
                name : 'union',
                value: value.map(process)
            };
        case 'objectOf':
        case 'arrayOf':
        default:
            return noUndefined(
                { name, value: process(value), required, description });
    }
};
const pickType = (type) => {
    const ptype = typeof type;
    switch (ptype) {
        case 'undefined':
            return {};

        case 'string':
        case 'number':
        case 'symbol':
            return {
                name: ptype
            };
        case 'boolean':
            return {
                name: 'bool'
            };
        case 'function':
            return {
                name: 'func'
            };
        case 'object':
            return {
                name: Array.isArray(type) ? 'array' : 'object'
            }
    }
};
module.exports = function ({ propTypes = {}, defaultProps = {} }) {
    propTypes = toDocs(propTypes);

    return keys(defaultProps).reduce((ret, key) => {
        const val = defaultProps[key]
        if (!ret[key]) {
            ret[key] = {
                type        : pickType(val),
                defaultValue: enumify(val)
            }
        } else if (ret[key].defaultValue == null) {
            ret[key].defaultValue = enumify(val);
        }
        return ret;
    }, keys(propTypes).reduce((ret, key) => {
        const {
                  required          = false, value,
                  type, description = ''
              } = propTypes[key];

        ret[key] = noUndefined({
            description,
            required,
            defaultValue: defaultProps[key] != null ? enumify(
                defaultProps[key])
                : void(0),
            type        : process({ type, value }),
            tags        : {}
        });

        return ret;

    }, {}));
};
