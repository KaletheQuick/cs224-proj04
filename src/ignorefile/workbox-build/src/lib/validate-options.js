/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import { oneLine as ol } from 'common-tags';
import Ajv from 'ajv';
import { errors } from './errors';
const ajv = new Ajv({
    useDefaults: true,
});
const DEFAULT_EXCLUDE_VALUE = [/\.map$/, /^manifest.*\.js$/];
export class WorkboxConfigError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
// Some methods need to do follow-up validation using the JSON schema,
// so return both the validated options and then schema.
function validate(input, methodName) {
    // Don't mutate input: https://github.com/GoogleChrome/workbox/issues/2158
    const inputCopy = Object.assign({}, input);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonSchema = require(`../schema/${methodName}Options.json`);
    const validate = ajv.compile(jsonSchema);
    if (validate(inputCopy)) {
        // All methods support manifestTransforms, so validate it here.
        ensureValidManifestTransforms(inputCopy);
        return [inputCopy, jsonSchema];
    }
    const betterErrors = betterAjvErrors({
        basePath: methodName,
        data: input,
        errors: validate.errors,
        // This is needed as JSONSchema6 is expected, but JSONSchemaType works.
        // eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment
        schema: jsonSchema,
    });
    const messages = betterErrors.map((err) => ol `[${err.path}] ${err.message}.
    ${err.suggestion ? err.suggestion : ''}`);
    throw new WorkboxConfigError(messages.join('\n\n'));
}
function ensureValidManifestTransforms(options) {
    if ('manifestTransforms' in options &&
        !(Array.isArray(options.manifestTransforms) &&
            options.manifestTransforms.every((item) => typeof item === 'function'))) {
        throw new WorkboxConfigError(errors['manifest-transforms']);
    }
}
function ensureValidNavigationPreloadConfig(options) {
    if (options.navigationPreload &&
        (!Array.isArray(options.runtimeCaching) ||
            options.runtimeCaching.length === 0)) {
        throw new WorkboxConfigError(errors['nav-preload-runtime-caching']);
    }
}
function ensureValidCacheExpiration(options) {
    var _a, _b;
    for (const runtimeCaching of options.runtimeCaching || []) {
        if (((_a = runtimeCaching.options) === null || _a === void 0 ? void 0 : _a.expiration) &&
            !((_b = runtimeCaching.options) === null || _b === void 0 ? void 0 : _b.cacheName)) {
            throw new WorkboxConfigError(errors['cache-name-required']);
        }
    }
}
function ensureValidRuntimeCachingOrGlobDirectory(options) {
    if (!options.globDirectory &&
        (!Array.isArray(options.runtimeCaching) ||
            options.runtimeCaching.length === 0)) {
        throw new WorkboxConfigError(errors['no-manifest-entries-or-runtime-caching']);
    }
}
// This is... messy, because we can't rely on the built-in ajv validation for
// runtimeCaching.handler, as it needs to accept {} (i.e. any) due to
// https://github.com/GoogleChrome/workbox/pull/2899
// So we need to perform validation when a string (not a function) is used.
function ensureValidStringHandler(options, jsonSchema) {
    var _a, _b, _c, _d;
    let validHandlers = [];
    /* eslint-disable */
    for (const handler of ((_d = (_c = (_b = (_a = jsonSchema.definitions) === null || _a === void 0 ? void 0 : _a.RuntimeCaching) === null || _b === void 0 ? void 0 : _b.properties) === null || _c === void 0 ? void 0 : _c.handler) === null || _d === void 0 ? void 0 : _d.anyOf) || []) {
        if ('enum' in handler) {
            validHandlers = handler.enum;
            break;
        }
    }
    /* eslint-enable */
    for (const runtimeCaching of options.runtimeCaching || []) {
        if (typeof runtimeCaching.handler === 'string' &&
            !validHandlers.includes(runtimeCaching.handler)) {
            throw new WorkboxConfigError(errors['invalid-handler-string'] + runtimeCaching.handler);
        }
    }
}
export function validateGenerateSWOptions(input) {
    const [validatedOptions, jsonSchema] = validate(input, 'GenerateSW');
    ensureValidNavigationPreloadConfig(validatedOptions);
    ensureValidCacheExpiration(validatedOptions);
    ensureValidRuntimeCachingOrGlobDirectory(validatedOptions);
    ensureValidStringHandler(validatedOptions, jsonSchema);
    return validatedOptions;
}
export function validateGetManifestOptions(input) {
    const [validatedOptions] = validate(input, 'GetManifest');
    return validatedOptions;
}
export function validateInjectManifestOptions(input) {
    const [validatedOptions] = validate(input, 'InjectManifest');
    return validatedOptions;
}
// The default `exclude: [/\.map$/, /^manifest.*\.js$/]` value can't be
// represented in the JSON schema, so manually set it for the webpack options.
export function validateWebpackGenerateSWOptions(input) {
    const inputWithExcludeDefault = Object.assign({
        // Make a copy, as exclude can be mutated when used.
        exclude: Array.from(DEFAULT_EXCLUDE_VALUE),
    }, input);
    const [validatedOptions, jsonSchema] = validate(inputWithExcludeDefault, 'WebpackGenerateSW');
    ensureValidNavigationPreloadConfig(validatedOptions);
    ensureValidCacheExpiration(validatedOptions);
    ensureValidStringHandler(validatedOptions, jsonSchema);
    return validatedOptions;
}
export function validateWebpackInjectManifestOptions(input) {
    const inputWithExcludeDefault = Object.assign({
        // Make a copy, as exclude can be mutated when used.
        exclude: Array.from(DEFAULT_EXCLUDE_VALUE),
    }, input);
    const [validatedOptions] = validate(inputWithExcludeDefault, 'WebpackInjectManifest');
    return validatedOptions;
}
