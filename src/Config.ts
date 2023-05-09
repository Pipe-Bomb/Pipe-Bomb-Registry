import FS from "fs";

console.log("Loading config...");

export interface ConfigTemplate {
    server_port: number,
    external_server_check_frequency: number,
    external_server_allowed_fails: number
}

const defaultConfig: ConfigTemplate = {
    server_port: 8000,
    external_server_check_frequency: 1,
    external_server_allowed_fails: 2
}

let config: any;
const anyDefaultConfig: any = defaultConfig;

if (FS.existsSync("./Config.json")) {
    config = JSON.parse(FS.readFileSync("./Config.json").toString());
    console.log("Loaded config file");

    let error = false;
    let needsUpdating = false;

    for (let key of Object.keys(defaultConfig)) {
        if (!Object.keys(config).includes(key)) {
            console.log(`Config file is missing property "${key}", inserting default value of "`, anyDefaultConfig[key], `"`);
            needsUpdating = true;
            config[key] = anyDefaultConfig[key];
        } else if (typeof config[key] != typeof anyDefaultConfig[key]) {
            console.log(`Config file's property "${key}" is of invalid type "${typeof config[key]}". Delete this line from your config file or replace the value with the appropriate type (${typeof anyDefaultConfig[key]}). Default value is "`, anyDefaultConfig[key], `"`);
            error = true;
        }
    }

    if (needsUpdating) {
        FS.writeFileSync("./Config.json", JSON.stringify(config, null, 2));
    }

    if (error) {
        process.exit(0);
    }

    console.log("Config file is valid");
} else {
    config = defaultConfig;
    FS.writeFileSync("./Config.json", JSON.stringify(defaultConfig, null, 2));
    console.log("Created new config file");
}

const outConfig: ConfigTemplate = config;

export default function get() {
    return Object.assign({}, outConfig);
}