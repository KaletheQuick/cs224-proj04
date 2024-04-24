import { each, has, is, isDraftable, shallowCopy, latest, getCurrentScope, DRAFT_STATE, die, createProxy } from "../internal";
/**
 * Returns a new draft of the `base` object.
 *
 * The second argument is the parent draft-state (used internally).
 */
export function createProxyProxy(base, parent) {
    const isArray = Array.isArray(base);
    const state = {
        type_: isArray ? 1 /* ProxyType.ProxyArray */ : 0 /* ProxyType.ProxyObject */,
        // Track which produce call this is associated with.
        scope_: parent ? parent.scope_ : getCurrentScope(),
        // True for both shallow and deep changes.
        modified_: false,
        // Used during finalization.
        finalized_: false,
        // Track which properties have been assigned (true) or deleted (false).
        assigned_: {},
        // The parent draft state.
        parent_: parent,
        // The base state.
        base_: base,
        // The base proxy.
        draft_: null,
        // The base copy with any updated values.
        copy_: null,
        // Called by the `produce` function.
        revoke_: null,
        isManual_: false
    };
    // the traps must target something, a bit like the 'real' base.
    // but also, we need to be able to determine from the target what the relevant state is
    // (to avoid creating traps per instance to capture the state in closure,
    // and to avoid creating weird hidden properties as well)
    // So the trick is to use 'state' as the actual 'target'! (and make sure we intercept everything)
    // Note that in the case of an array, we put the state in an array to have better Reflect defaults ootb
    let target = state;
    let traps = objectTraps;
    if (isArray) {
        target = [state];
        traps = arrayTraps;
    }
    const { revoke, proxy } = Proxy.revocable(target, traps);
    state.draft_ = proxy;
    state.revoke_ = revoke;
    return proxy;
}
/**
 * Object drafts
 */
export const objectTraps = {
    get(state, prop) {
        if (prop === DRAFT_STATE)
            return state;
        const source = latest(state);
        if (!has(source, prop)) {
            // non-existing or non-own property...
            return readPropFromProto(state, source, prop);
        }
        const value = source[prop];
        if (state.finalized_ || !isDraftable(value)) {
            return value;
        }
        // Check for existing draft in modified state.
        // Assigned values are never drafted. This catches any drafts we created, too.
        if (value === peek(state.base_, prop)) {
            prepareCopy(state);
            return (state.copy_[prop] = createProxy(state.scope_.immer_, value, state));
        }
        return value;
    },
    has(state, prop) {
        return prop in latest(state);
    },
    ownKeys(state) {
        return Reflect.ownKeys(latest(state));
    },
    set(state, prop /* strictly not, but helps TS */, value) {
        const desc = getDescriptorFromProto(latest(state), prop);
        if (desc === null || desc === void 0 ? void 0 : desc.set) {
            // special case: if this write is captured by a setter, we have
            // to trigger it with the correct context
            desc.set.call(state.draft_, value);
            return true;
        }
        if (!state.modified_) {
            // the last check is because we need to be able to distinguish setting a non-existing to undefined (which is a change)
            // from setting an existing property with value undefined to undefined (which is not a change)
            const current = peek(latest(state), prop);
            // special case, if we assigning the original value to a draft, we can ignore the assignment
            const currentState = current === null || current === void 0 ? void 0 : current[DRAFT_STATE];
            if (currentState && currentState.base_ === value) {
                state.copy_[prop] = value;
                state.assigned_[prop] = false;
                return true;
            }
            if (is(value, current) && (value !== undefined || has(state.base_, prop)))
                return true;
            prepareCopy(state);
            markChanged(state);
        }
        if ((state.copy_[prop] === value &&
            // special case: handle new props with value 'undefined'
            (value !== undefined || prop in state.copy_)) ||
            // special case: NaN
            (Number.isNaN(value) && Number.isNaN(state.copy_[prop])))
            return true;
        // @ts-ignore
        state.copy_[prop] = value;
        state.assigned_[prop] = true;
        return true;
    },
    deleteProperty(state, prop) {
        // The `undefined` check is a fast path for pre-existing keys.
        if (peek(state.base_, prop) !== undefined || prop in state.base_) {
            state.assigned_[prop] = false;
            prepareCopy(state);
            markChanged(state);
        }
        else {
            // if an originally not assigned property was deleted
            delete state.assigned_[prop];
        }
        // @ts-ignore
        if (state.copy_)
            delete state.copy_[prop];
        return true;
    },
    // Note: We never coerce `desc.value` into an Immer draft, because we can't make
    // the same guarantee in ES5 mode.
    getOwnPropertyDescriptor(state, prop) {
        const owner = latest(state);
        const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
        if (!desc)
            return desc;
        return {
            writable: true,
            configurable: state.type_ !== 1 /* ProxyType.ProxyArray */ || prop !== "length",
            enumerable: desc.enumerable,
            value: owner[prop]
        };
    },
    defineProperty() {
        die(11);
    },
    getPrototypeOf(state) {
        return Object.getPrototypeOf(state.base_);
    },
    setPrototypeOf() {
        die(12);
    }
};
/**
 * Array drafts
 */
const arrayTraps = {};
each(objectTraps, (key, fn) => {
    // @ts-ignore
    arrayTraps[key] = function () {
        arguments[0] = arguments[0][0];
        return fn.apply(this, arguments);
    };
});
arrayTraps.deleteProperty = function (state, prop) {
    if (__DEV__ && isNaN(parseInt(prop)))
        die(13);
    // @ts-ignore
    return arrayTraps.set.call(this, state, prop, undefined);
};
arrayTraps.set = function (state, prop, value) {
    if (__DEV__ && prop !== "length" && isNaN(parseInt(prop)))
        die(14);
    return objectTraps.set.call(this, state[0], prop, value, state[0]);
};
// Access a property without creating an Immer draft.
function peek(draft, prop) {
    const state = draft[DRAFT_STATE];
    const source = state ? latest(state) : draft;
    return source[prop];
}
function readPropFromProto(state, source, prop) {
    var _a;
    const desc = getDescriptorFromProto(source, prop);
    return desc
        ? `value` in desc
            ? desc.value
            : // This is a very special case, if the prop is a getter defined by the
                // prototype, we should invoke it with the draft as context!
                (_a = desc.get) === null || _a === void 0 ? void 0 : _a.call(state.draft_)
        : undefined;
}
function getDescriptorFromProto(source, prop) {
    // 'in' checks proto!
    if (!(prop in source))
        return undefined;
    let proto = Object.getPrototypeOf(source);
    while (proto) {
        const desc = Object.getOwnPropertyDescriptor(proto, prop);
        if (desc)
            return desc;
        proto = Object.getPrototypeOf(proto);
    }
    return undefined;
}
export function markChanged(state) {
    if (!state.modified_) {
        state.modified_ = true;
        if (state.parent_) {
            markChanged(state.parent_);
        }
    }
}
export function prepareCopy(state) {
    if (!state.copy_) {
        state.copy_ = shallowCopy(state.base_);
    }
}
