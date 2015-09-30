var grunt = require("grunt");
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-coffeelint');
grunt.loadNpmTasks('grunt-contrib-coffee');
grunt.loadNpmTasks('grunt-release');
grunt.initConfig({
	coffeelint: {
		app: ['src/**/*.coffee', '*.coffee'],
		options: {
			'max_line_length': {
				level: 'ignore'
			}
		}
	},
	watch: {
		scripts: {
			files: ['src/**/*.{coffee,js}', '*.{coffee,js}'],
			tasks: ['all'],
			options: {
				spawn: false
			}
		}
	},
	coffee: {
		multiple: {
			options: {
				sourceMap: true,
				sourceMapDir: 'compiled/maps/'
			},
			expand: true,
			cwd: 'src',
			src: '**/*.coffee',
			dest: 'compiled/',
			ext: '.js'
		}
	},
	release: {
		options: {
			bump: true,
			npm: true,
			npmTag: "<%= version %>"
		}
	}
});
grunt.registerTask("all", ["coffeelint", "coffee"]);
grunt.registerTask("default", ["all", "watch"]);
grunt.registerTask("prod", ["all", "release"]);
