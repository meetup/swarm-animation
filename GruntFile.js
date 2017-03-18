module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	const DOCS_SRC = 'docs/src/',
		DOCS_DEST = 'docs/dest/',
		TEST_DEST = 'test/dest/',
		DIST = 'dist/',
		SRC = 'src/';

	const WATCH_PATHS = [
		'docs/templates/**/*.*',
		'src/*.scss',
		'src/js/*.js'
	];

	grunt.initConfig({
		'package': grunt.file.readJSON('package.json'),

		'clean': {
			css: ['dist/*.css', 'docs/dest'],
			test : ['test/dest'],
			js: ['dist/*.js']
		},

		'sass': {
			dist: {
				files: {
					'dist/animation.css': 'src/animation.scss',
					// css for docs
					[`${DOCS_DEST}css/animation.css`]: `${SRC}animation.scss`,
					[`${DOCS_DEST}css/doc_styles.css`]: `${DOCS_SRC}css/doc_styles.scss`,
				}
			}
		},

		'copy': {
			docs: {
				expand: true,
				cwd: `${DOCS_SRC}assets/`,
				src: '*.*',
				dest: `${DOCS_DEST}assets/`
			}
		},

		'webpack': {
			// use babel loader to turn es6 to js for
			// test/dest dir

			// build swarmAnimation.js for distribution
			dist: {
				entry: `./${SRC}js/swarmAnimation.js`,
				output: {
					path: `./${DIST}`,
					filename: 'swarmAnimation.js'
				},
				module: {
					loaders: [{
						test: /\.js$/,
						exclude: /node_modules/,
						loader: 'babel-loader'
					}]
				}
			},
			// build js for docs: swarmAnimation + docs.js into docs/dest
			docs: {
				entry: {
					swarmAnimation: [`./${SRC}js/swarmAnimation.js`],
					site_docs: `./${DOCS_SRC}js/docs.js`
				},
				output: {
					path: `./${DOCS_DEST}js`,
					filename: '[name].js'
				},
				stats: {
					errorDetails: true
				},
				module: {
					loaders: [{
						test: /\.js$/,
						exclude: /node_modules/,
						loader: 'babel-loader'
					}]
				},
				externals: {
					jquery: 'jQuery'
				}
			},

			// TODO, make test just use compiled swarmAnimation from main
			// so not to recompile, maybe just copy ??
			test: {
				// compile js for test: swarmAnimation + spec
				entry: {
					swarmAnimation: ['./src/js/swarmAnimation.js'],
					spec: './test/specs/DummySpec.js',
				},
				output: {
					path: `./${TEST_DEST}`,
					filename: '[name]_test.js'
				},
				module: {
					loaders: [{
						test: /\.js$/,
						exclude: /node_modules/,
						loader: 'babel-loader'
					}]
				}
			}
		},

		'webpack-dev-server': {},

		'connect': {
			jasmine_site: {
				options: {
					base: {
						path: `./${TEST_DEST}`,
						options: {
							index: `./${TEST_DEST}SpecRunner.html`
						}
					},
					port: 8888,
				}
			},
			docs: {
				options: {
					base: {
						path: DOCS_DEST,
						options: {
							index: 'index.html'
						}
					},
					port: 8111,
					keepalive: true
				}
			}
		},

		'jasmine': {
			src: `${TEST_DEST}swarmAnimation_test.js`,
			options: {
				specs: `${TEST_DEST}spec_test.js`,
				outfile: `${TEST_DEST}SpecRunner.html`,
				tempDir: `${TEST_DEST}/jasmine`,
				keepRunner: true
				// host: 'http://127.0.0.1:8000/'
			}
		},

		'preprocess': {
			// preprocess docs
			options: {
				context: {
					VERSION: '<%= package.version %>',
					DESCRIPTION: '<%= package.description %>',
					SQ2_URL: 'https://meetup.github.io/sassquatch2/bundle/sassquatch.css',
					FONT_URL: 'https://secure.meetupstatic.com/fonts/graphik.css',
					ANIMATION_CSS_PATH: 'css/animation.css',
					DOCS_CSS_PATH: 'css/doc_styles.css',
					ANIMATION_JS_PATH: 'js/swarmAnimation.js',
					DOCS_JS_PATH: 'js/site_docs.js'
				},
			},
			docs: {
				files: {
					// doc.html seldon --> index.html
					'docs/dest/index.html': `${DOCS_DEST}doc.html`
				}
			}
		},

		'gh-pages': {
			options: {
				base: DOCS_DEST
			},
			src: ['**']
		},

		'exec': {
			options: {
				shell: 'bash'
			},
			seldon: 'node node_modules/seldon/seldon.js seldon.config.json'
		},

		'watch': {
			files: WATCH_PATHS,
			tasks: ['local-docs']
		},
	});

	// TODO grunt copy for js, lint, uglify?
	grunt.registerTask('compile', ['clean', 'sass', 'webpack:dist']);
	grunt.registerTask('default', ['compile']);
	grunt.registerTask('_docs', [ 'compile', 'webpack:docs', 'copy:docs', 'exec:seldon', 'preprocess']);
	grunt.registerTask('local-docs', [ '_docs', 'connect:docs']);
	grunt.registerTask('docs', ['_docs', 'gh-pages']);
	grunt.registerTask('test', ['clean:test', 'webpack:test', 'jasmine', 'connect:jasmine_site:keepalive']);
	grunt.registerTask('travis', ['clean:test', 'webpack', 'jasmine']);
};
