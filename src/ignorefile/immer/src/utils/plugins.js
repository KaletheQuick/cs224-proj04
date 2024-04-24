import { die } from "../internal";
/** Plugin utilities */
const plugins = {};
export function getPlugin(pluginKey) {
    const plugin = plugins[pluginKey];
    if (!plugin) {
        die(18, pluginKey);
    }
    // @ts-ignore
    return plugin;
}
export function loadPlugin(pluginKey, implementation) {
    if (!plugins[pluginKey])
        plugins[pluginKey] = implementation;
}
