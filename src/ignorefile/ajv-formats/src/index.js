import { formatNames, fastFormats, fullFormats, } from "./formats";
import formatLimit from "./limit";
import { _, Name } from "ajv/dist/compile/codegen";
const fullName = new Name("fullFormats");
const fastName = new Name("fastFormats");
const formatsPlugin = (ajv, opts = { keywords: true }) => {
    if (Array.isArray(opts)) {
        addFormats(ajv, opts, fullFormats, fullName);
        return ajv;
    }
    const [formats, exportName] = opts.mode === "fast" ? [fastFormats, fastName] : [fullFormats, fullName];
    const list = opts.formats || formatNames;
    addFormats(ajv, list, formats, exportName);
    if (opts.keywords)
        formatLimit(ajv);
    return ajv;
};
formatsPlugin.get = (name, mode = "full") => {
    const formats = mode === "fast" ? fastFormats : fullFormats;
    const f = formats[name];
    if (!f)
        throw new Error(`Unknown format "${name}"`);
    return f;
};
function addFormats(ajv, list, fs, exportName) {
    var _a;
    var _b;
    (_a = (_b = ajv.opts.code).formats) !== null && _a !== void 0 ? _a : (_b.formats = _ `require("ajv-formats/dist/formats").${exportName}`);
    for (const f of list)
        ajv.addFormat(f, fs[f]);
}
module.exports = exports = formatsPlugin;
Object.defineProperty(exports, "__esModule", { value: true });
export default formatsPlugin;
