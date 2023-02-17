import yaml from 'yaml'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { Configuration } from '../types/types'

const loadConfiguration = () : Configuration => {
    let config;
    try {
        const configPath = path.join(os.homedir(), ".kavka", "config.yml");
        const file = fs.readFileSync(configPath, 'utf8');
        config = yaml.parse(file);
        return config;
    } catch (err) {
        console.log("Error reading configuration", err.message);
    }
}

export default loadConfiguration();