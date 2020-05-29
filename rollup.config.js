import svelte from 'rollup-plugin-svelte';
import builtins from 'rollup-plugin-node-builtins';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';


const production = !process.env.ROLLUP_WATCH;

export default [
    {
        input: 'src/webapp/main.js',
        output: {
	    sourcemap: true,
	    format: 'iife',
	    name: 'app',
	    file: 'public/build/bundle.js'
        },
        plugins: [
            json(),
            replace({
                BUILD_TIME : ()=>new Date()+'',
                BUILD_MS : ()=>new Date().getTime(),
            }),
	    svelte({
	        // enable run-time checks when not in production
	        dev: !production,
	        // we'll extract any component CSS out into
	        // a separate file  better for performance
	        css: css => {
		    css.write('public/build/bundle.css');
	        } 
	    }),

	    // If you have external dependencies installed from
	    // npm, you'll most likely need these plugins. In
	    // some cases you'll need additional configuration 
	    // consult the documentation for details:
	    // https://github.com/rollup/plugins/tree/master/packages/commonjs
	    resolve({
	        browser: true,
	        dedupe: ['svelte']
	    }),
            // babel({
            //     // exclude: 'node_modules/**', // only transpile our source code
            //     // plugins: ["@babel/plugin-transform-named-capturing-groups-regex"]
            // }),
	    commonjs(),
            builtins(),
	    !production && serve(),
            !production && livereload('public'),
	    // If we're building for production (npm run build
	    // instead of npm run dev), minify
	    production && terser()
        ],
        watch: {
	    clearScreen: false
        }
    },
    {
        input : 'src/data/functions/api.js',
        output : {
            sourcemap : true,
            format: 'cjs',
            name : 'functions',
            file : 'functions/api.js'
        },
        plugins : [
            json(),
            production && replace(
                'MONGO_DB_NAME','Gourmet'
            ),
            !production && replace(
                'MONGO_DB_NAME','devtest',
            ),
        ]
    },
    {
        input : 'src/extension/background.js',
        output : {
            sourcemap : true,
            format : 'iife',
            name : 'extension',
            file : 'extension/background.js',
        },
        plugins : [
            replace({
                BUILD_TIME : ()=>new Date()+'',
                BUILD_MS : ()=>new Date().getTime(),
            }),
        ]
    },
    {
        input : 'src/extension/content.js',
        output : {
            sourcemap : true,
            format : 'iife',
            name : 'extension',
            file : 'extension/content.js',
        },
        plugins : [
            svelte({
	        // enable run-time checks when not in production
	        dev: !production
	        // we'll extract any component CSS out into
	        // a separate file  better for performance
	    }),
            replace({
                BUILD_TIME : ()=>new Date()+'',
                BUILD_MS : ()=>new Date().getTime(),
            }),
            resolve({
	        browser: true,
	        dedupe: ['svelte']
	    }),
            // babel({
            //     // exclude: 'node_modules/**', // only transpile our source code
            //     // plugins: ["@babel/plugin-transform-named-capturing-groups-regex"]
            // }),
	    commonjs(),
            builtins(),
	    // In dev mode, call `npm run start` once
	    // the bundle has been generated


	    // Watch the `public` directory and refresh the
	    // browser on changes when not in production
	    //!production && livereload('extension'),

	    // If we're building for production (npm run build
	    // instead of npm run dev), minify
	    production && terser()
            

        ],


    },
    {
        input : 'src/extension/embed.js',
        output : {
            sourcemap : true,
            format : 'iife',
            name : 'extension',
            file : 'extension/embed.js',
        },
        plugins : [
            svelte({
	        // enable run-time checks when not in production
	        dev: !production
	        // we'll extract any component CSS out into
	        // a separate file  better for performance
	    }),
            resolve({
	        browser: true,
	        dedupe: ['svelte']
	    })

        ],
    },


];

function serve() {
    let started = false;

    return {
	writeBundle() {
	    if (!started) {
		started = true;
                
		require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
		    stdio: ['ignore', 'inherit', 'inherit'],
		    shell: true
		});
	    }
	}
    };
}
