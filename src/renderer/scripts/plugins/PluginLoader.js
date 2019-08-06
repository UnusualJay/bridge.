import { BASE_PATH } from "../constants";
import path from "path";
import { promises as fs } from "fs";
import { readJSON } from "../utilities/JsonFS";
import Store from "../../store/index";
import Bridge from "../../scripts/plugins/PluginEnv";

let PLUGIN_FOLDERS;
let PLUGIN_DATA = [];

export default class PluginLoader {
    static async loadPlugins(project) {
        if(project === undefined) return;
        //INIT LEGACY INTERPRETER & UNLOAD LEGACY PLUGINS
        Store.commit("unloadPlugins");
        Bridge.Interpreter.init(project);

        try {
            PLUGIN_FOLDERS = await fs.readdir(path.join(BASE_PATH, project, "bridge/plugins"));
        } catch(e) {
            PLUGIN_FOLDERS = [];
        }
        
        console.log(PLUGIN_FOLDERS);
        PLUGIN_DATA = [];
        await Promise.all(PLUGIN_FOLDERS.map(plugin_folder => this.loadPlugin(project, plugin_folder)));

        //INIT LEGACY PLUGIN DATA FOR UI
        Store.commit("finishedPluginLoading");
        console.log(PLUGIN_DATA);
    }

    static async loadPlugin(project, plugin_folder) {
        let plugin_path = path.join(BASE_PATH, project, "bridge/plugins", plugin_folder);

        if((await fs.lstat(plugin_path)).isFile()) {
            //LEGACY PLUGINS
            Store.commit("loadPlugin", { 
                code: (await fs.readFile(plugin_path)).toString(), 
                path: plugin_path, 
                blocked: false
            });
        } else {
            let manifest;
            try {
                manifest = await readJSON(path.join(plugin_path, "manifest.json"));
            } catch(e) {
                return;
            }
            PLUGIN_DATA.push(manifest);
        }
    }
}