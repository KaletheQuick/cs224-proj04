import { die, isDraft, shallowCopy, each, DRAFT_STATE, get, set, isDraftable, getArchtype, getPlugin } from "../internal";
export function current(value) {
    if (!isDraft(value))
        die(22, value);
    return currentImpl(value);
}
function currentImpl(value) {
    if (!isDraftable(value))
        return value;
    const state = value[DRAFT_STATE];
    let copy;
    const archType = getArchtype(value);
    if (state) {
        if (!state.modified_ &&
            (state.type_ < 4 || !getPlugin("ES5").hasChanges_(state)))
            return state.base_;
        // Optimization: avoid generating new drafts during copying
        state.finalized_ = true;
        copy = copyHelper(value, archType);
        state.finalized_ = false;
    }
    else {
        copy = copyHelper(value, archType);
    }
    each(copy, (key, childValue) => {
        if (state && get(state.base_, key) === childValue)
            return; // no need to copy or search in something that didn't change
        set(copy, key, currentImpl(childValue));
    });
    // In the future, we might consider freezing here, based on the current settings
    return archType === 3 /* Archtype.Set */ ? new Set(copy) : copy;
}
function copyHelper(value, archType) {
    // creates a shallow copy, even if it is a map or set
    switch (archType) {
        case 2 /* Archtype.Map */:
            return new Map(value);
        case 3 /* Archtype.Set */:
            // Set will be cloned as array temporarily, so that we can replace individual items
            return Array.from(value);
    }
    return shallowCopy(value);
}
