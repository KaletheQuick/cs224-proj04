import { immerable } from "../immer";
import { get, each, has, getArchtype, isSet, isMap, loadPlugin, die, isDraft, isDraftable, NOTHING } from "../internal";
export function enablePatches() {
    const REPLACE = "replace";
    const ADD = "add";
    const REMOVE = "remove";
    function generatePatches_(state, basePath, patches, inversePatches) {
        switch (state.type_) {
            case 0 /* ProxyType.ProxyObject */:
            case 4 /* ProxyType.ES5Object */:
            case 2 /* ProxyType.Map */:
                return generatePatchesFromAssigned(state, basePath, patches, inversePatches);
            case 5 /* ProxyType.ES5Array */:
            case 1 /* ProxyType.ProxyArray */:
                return generateArrayPatches(state, basePath, patches, inversePatches);
            case 3 /* ProxyType.Set */:
                return generateSetPatches(state, basePath, patches, inversePatches);
        }
    }
    function generateArrayPatches(state, basePath, patches, inversePatches) {
        let { base_, assigned_ } = state;
        let copy_ = state.copy_;
        // Reduce complexity by ensuring `base` is never longer.
        if (copy_.length < base_.length) {
            // @ts-ignore
            ;
            [base_, copy_] = [copy_, base_];
            [patches, inversePatches] = [inversePatches, patches];
        }
        // Process replaced indices.
        for (let i = 0; i < base_.length; i++) {
            if (assigned_[i] && copy_[i] !== base_[i]) {
                const path = basePath.concat([i]);
                patches.push({
                    op: REPLACE,
                    path,
                    // Need to maybe clone it, as it can in fact be the original value
                    // due to the base/copy inversion at the start of this function
                    value: clonePatchValueIfNeeded(copy_[i])
                });
                inversePatches.push({
                    op: REPLACE,
                    path,
                    value: clonePatchValueIfNeeded(base_[i])
                });
            }
        }
        // Process added indices.
        for (let i = base_.length; i < copy_.length; i++) {
            const path = basePath.concat([i]);
            patches.push({
                op: ADD,
                path,
                // Need to maybe clone it, as it can in fact be the original value
                // due to the base/copy inversion at the start of this function
                value: clonePatchValueIfNeeded(copy_[i])
            });
        }
        if (base_.length < copy_.length) {
            inversePatches.push({
                op: REPLACE,
                path: basePath.concat(["length"]),
                value: base_.length
            });
        }
    }
    // This is used for both Map objects and normal objects.
    function generatePatchesFromAssigned(state, basePath, patches, inversePatches) {
        const { base_, copy_ } = state;
        each(state.assigned_, (key, assignedValue) => {
            const origValue = get(base_, key);
            const value = get(copy_, key);
            const op = !assignedValue ? REMOVE : has(base_, key) ? REPLACE : ADD;
            if (origValue === value && op === REPLACE)
                return;
            const path = basePath.concat(key);
            patches.push(op === REMOVE ? { op, path } : { op, path, value });
            inversePatches.push(op === ADD
                ? { op: REMOVE, path }
                : op === REMOVE
                    ? { op: ADD, path, value: clonePatchValueIfNeeded(origValue) }
                    : { op: REPLACE, path, value: clonePatchValueIfNeeded(origValue) });
        });
    }
    function generateSetPatches(state, basePath, patches, inversePatches) {
        let { base_, copy_ } = state;
        let i = 0;
        base_.forEach((value) => {
            if (!copy_.has(value)) {
                const path = basePath.concat([i]);
                patches.push({
                    op: REMOVE,
                    path,
                    value
                });
                inversePatches.unshift({
                    op: ADD,
                    path,
                    value
                });
            }
            i++;
        });
        i = 0;
        copy_.forEach((value) => {
            if (!base_.has(value)) {
                const path = basePath.concat([i]);
                patches.push({
                    op: ADD,
                    path,
                    value
                });
                inversePatches.unshift({
                    op: REMOVE,
                    path,
                    value
                });
            }
            i++;
        });
    }
    function generateReplacementPatches_(baseValue, replacement, patches, inversePatches) {
        patches.push({
            op: REPLACE,
            path: [],
            value: replacement === NOTHING ? undefined : replacement
        });
        inversePatches.push({
            op: REPLACE,
            path: [],
            value: baseValue
        });
    }
    function applyPatches_(draft, patches) {
        patches.forEach(patch => {
            const { path, op } = patch;
            let base = draft;
            for (let i = 0; i < path.length - 1; i++) {
                const parentType = getArchtype(base);
                let p = path[i];
                if (typeof p !== "string" && typeof p !== "number") {
                    p = "" + p;
                }
                // See #738, avoid prototype pollution
                if ((parentType === 0 /* Archtype.Object */ || parentType === 1 /* Archtype.Array */) &&
                    (p === "__proto__" || p === "constructor"))
                    die(24);
                if (typeof base === "function" && p === "prototype")
                    die(24);
                base = get(base, p);
                if (typeof base !== "object")
                    die(15, path.join("/"));
            }
            const type = getArchtype(base);
            const value = deepClonePatchValue(patch.value); // used to clone patch to ensure original patch is not modified, see #411
            const key = path[path.length - 1];
            switch (op) {
                case REPLACE:
                    switch (type) {
                        case 2 /* Archtype.Map */:
                            return base.set(key, value);
                        /* istanbul ignore next */
                        case 3 /* Archtype.Set */:
                            die(16);
                        default:
                            // if value is an object, then it's assigned by reference
                            // in the following add or remove ops, the value field inside the patch will also be modifyed
                            // so we use value from the cloned patch
                            // @ts-ignore
                            return (base[key] = value);
                    }
                case ADD:
                    switch (type) {
                        case 1 /* Archtype.Array */:
                            return key === "-"
                                ? base.push(value)
                                : base.splice(key, 0, value);
                        case 2 /* Archtype.Map */:
                            return base.set(key, value);
                        case 3 /* Archtype.Set */:
                            return base.add(value);
                        default:
                            return (base[key] = value);
                    }
                case REMOVE:
                    switch (type) {
                        case 1 /* Archtype.Array */:
                            return base.splice(key, 1);
                        case 2 /* Archtype.Map */:
                            return base.delete(key);
                        case 3 /* Archtype.Set */:
                            return base.delete(patch.value);
                        default:
                            return delete base[key];
                    }
                default:
                    die(17, op);
            }
        });
        return draft;
    }
    function deepClonePatchValue(obj) {
        if (!isDraftable(obj))
            return obj;
        if (Array.isArray(obj))
            return obj.map(deepClonePatchValue);
        if (isMap(obj))
            return new Map(Array.from(obj.entries()).map(([k, v]) => [k, deepClonePatchValue(v)]));
        if (isSet(obj))
            return new Set(Array.from(obj).map(deepClonePatchValue));
        const cloned = Object.create(Object.getPrototypeOf(obj));
        for (const key in obj)
            cloned[key] = deepClonePatchValue(obj[key]);
        if (has(obj, immerable))
            cloned[immerable] = obj[immerable];
        return cloned;
    }
    function clonePatchValueIfNeeded(obj) {
        if (isDraft(obj)) {
            return deepClonePatchValue(obj);
        }
        else
            return obj;
    }
    loadPlugin("Patches", {
        applyPatches_,
        generatePatches_,
        generateReplacementPatches_
    });
}
