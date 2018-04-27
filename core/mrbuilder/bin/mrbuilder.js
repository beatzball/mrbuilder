#!/usr/bin/env node
//for better yarn/npm compatibility.
if (require('in-publish').inInstall()) {
    process.exit(0);
}

const { env, argv } = process;
const profile       = env.MRBUILDER_PROFILE || ((idx) => {
                                                if (idx > -1) {
                                                    if (argv[idx].includes('=')) {
                                                        argv.splice(idx, 1);
                                                        return argv[idx].split('=', 2).pop();
                                                    } else {
                                                        let arg = process.argv[idx + 1];
                                                        argv.splice(idx, 2);
                                                        return arg;
                                                    }
                                                }
                                            })(argv.slice(2).findIndex(v => /^--mrbuilder-profile(=.*)?$/.test(v)))
                      || argv[1].replace(/^(.*\/)?mrbuilder(-?(.*)(\.js))?$/, '$2')
                      || env['npm_lifecycle_event'] ;

if (!env.MRBUILDER_INTERNAL_PRESETS){
    env.MRBUILDER_INTERNAL_PRESETS = 'mrbuilder';
}

function help(message) {
    console.warn(`
    ${message}
     $ MRBUILDER_PROFILE=${profile || 'test'} ${process.argv[0]} ${process.argv[1]}
    
     Supported profile's are

            karma       - runs karma
            test        - runs karma once
            mocha       - runs mocha
            babel       - runs babel
            app         - runs webpack in app mode
            app:start   - runs webpack-dev-server in app mode
            start:app   - alias to app:start
            demo        - runs webpack in demo mode
            demo:start  - runs webpack-dev-server in demo mode
            start:demo  - alias to demo:start
            build       - alias to prepublish
            production  - alias to prepublish
            prepublish  - runs webpack in production mode unless otherwise defined.
            start       - starts webpack-dev-server
            dev-server  - starts webpack-dev-server
            development - starts webpack-dev-server
            analyze     - starts webpack-dev-server in analyze mode
            
            
            or
            start:{PROFILE} - starts webpack-dev-server in whatever PROFILE is specified.
            {PROFILE} - starts webpack in whatevever PROFILE is specified.
            Please either run from a scripts in package.json or set the
            MRBUILDER_PROFILE variable.
            
            For example to run tests
            $ MRBUILDER_PROFILE=test ${process.env[1]}
            
            or in package.json
            
            {
              "name":"your_package",
              ...
              "scripts":{
                 "test":"mrbuilder",
                 "karma":"mrbuilder",
                 "start":"mrbuilder",
                 "prepublish":"mrbuilder"
              }
            } 
    `);
    process.exit(1);
}


if (!profile) {
    help(`Please either run from a scripts in package.json or set the
    MRBUILDER_PROFILE variable`);
}
switch (profile) {
    case "help":
        help('This helpful message');
        break;
    case "mocha":
    case "karma":
    case "test":
        if (!env.NODE_ENV) {
            env.NODE_ENV = 'test';
        }
        if (!env.MRBUILDER_ENV) {
            env.MRBUILDER_ENV = profile;
        }
        break;
    case "babel":
        if (!env.NODE_ENV){
            env.NODE_ENV = 'production';
        }
        if (!env.MRBUILDER_ENV) {
            env.MRBUILDER_ENV = profile;
        }
        break;
    case "webpack":
    case "build":
    case "prepublishOnly":
    case "prepublish":
    case "production":
        if (!env.NODE_ENV) {
            env.NODE_ENV = 'production';
        }
        if (!env.MRBUILDER_ENV) {
            env.MRBUILDER_ENV = 'production';

            if (argv.slice(2).find(v => /--(app|demo)(=.*)?$/.test(v))) {
                env.MRBUILDER_ENV = `${env.MRBUILDER_ENV}:app`;
            } else {
                env.MRBUILDER_ENV = `${env.MRBUILDER_ENV}:lib`;
            }
        }
        break;
    case "analyze":
        if (!env.MRBUILDER_ENV) {
            env.MRBUILDER_ENV = profile;
        }
        break;

    case "server":
    case "start":
    case "dev-server":
    case "webpack-dev-server":
    case "development": {
        if (!env.NODE_ENV) {
            env.NODE_ENV = 'development';
        }
        if (!env.MRBUILDER_ENV) {
            env.MRBUILDER_ENV = 'start:app';
        }
        break;
    }
    //just for documentation.
    case "lib":
    case "demo":
    case "app":
    default: {
        const parts      = profile.split(':', 2);
        const [p, start] = parts[0] === 'start' ? [parts[1], parts[0]] : parts;
        if (start === 'start') {
            if (!env.NODE_ENV) {
                env.NODE_ENV = 'development';
            }
        }
        if (!env.MRBUILDER_ENV) {
            env.MRBUILDER_ENV = p || profile;
        }
    }
}



const om = global._MRBUILDER_OPTIONS_MANAGER
           || (global._MRBUILDER_OPTIONS_MANAGER =
        new (require('mrbuilder-optionsmanager'))({
            prefix: 'mrbuilder', _require: require
        }));


if (om.enabled('mrbuilder-plugin-webpack-dev-server')) {
    require('mrbuilder-plugin-webpack-dev-server/bin/cli');
} else if (om.enabled('mrbuilder-plugin-karma')) {
    require('mrbuilder-plugin-karma/bin/cli');
} else if (om.enabled('mrbuilder-plugin-webpack')) {
    require('mrbuilder-plugin-webpack/bin/cli');
} else if (om.enabled('mrbuilder-plugin-mocha')) {
    require('mrbuilder-plugin-mocha/bin/cli');
} else if (om.enabled('mrbuilder-plugin-babel')) {
    require('mrbuilder-plugin-babel/bin/cli');
} else {
    help(`could not find a script to execute for profile '${profile}'.`);
}
