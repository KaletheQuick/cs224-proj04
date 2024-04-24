import * as buildTools from "turbo-gulp";
import { registerLibTasks } from "turbo-gulp/targets/lib";
import { registerMochaTasks } from "turbo-gulp/targets/mocha";
import gulp from "gulp";
import minimist from "minimist";
const options = minimist(process.argv.slice(2), {
    string: ["devDist"],
    default: { devDist: undefined },
    alias: { devDist: "dev-dist" },
});
const project = {
    root: __dirname,
    packageJson: "package.json",
    buildDir: "build",
    distDir: "dist",
    srcDir: "src",
    typescript: {}
};
const lib = {
    project,
    name: "lib",
    srcDir: "src/lib",
    scripts: ["**/*.ts"],
    mainModule: "index",
    dist: {
        packageJsonMap: (old) => {
            const version = options.devDist !== undefined ? `${old.version}-build.${options.devDist}` : old.version;
            return Object.assign(Object.assign({}, old), { version, scripts: undefined, private: false });
        },
        npmPublish: {
            tag: options.devDist !== undefined ? "next" : "latest",
        },
    },
    tscOptions: {
        declaration: true,
        skipLibCheck: true,
    },
    typedoc: {
        dir: "typedoc",
        name: "Helpers for V8 coverage files",
        deploy: {
            repository: "git@github.com:demurgos/v8-coverage.git",
            branch: "gh-pages",
        },
    },
    copy: [
        {
            files: ["**/*.json"],
        },
    ],
    clean: {
        dirs: ["build/lib", "dist/lib"],
    },
};
const test = {
    project,
    name: "test",
    srcDir: "src",
    scripts: ["test/**/*.ts", "lib/**/*.ts", "e2e/*/*.ts"],
    customTypingsDir: "src/custom-typings",
    tscOptions: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
    },
    // generateTestMain: true,
    copy: [
        {
            src: "e2e",
            // <project-name>/(project|test-resources)/<any>
            files: ["*/project/**/*", "*/test-resources/**/*"],
            dest: "e2e",
        },
    ],
    clean: {
        dirs: ["build/test"],
    },
};
const libTasks = registerLibTasks(gulp, lib);
registerMochaTasks(gulp, test);
buildTools.projectTasks.registerAll(gulp, project);
gulp.task("all:tsconfig.json", gulp.parallel("lib:tsconfig.json", "test:tsconfig.json"));
gulp.task("dist", libTasks.dist);
gulp.task("default", libTasks.dist);
