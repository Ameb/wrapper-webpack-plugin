'use strict';

var ConcatSource = require("webpack-sources").ConcatSource;
var ModuleFilenameHelpers = require("webpack/lib/ModuleFilenameHelpers");

/**
 * @param args
 * @param {string|function} [args.header]
 * @param {string|function} [args.footer]
 * @param {string|RegExp} [args.test]
 * @param {boolean} [args.runAfterOptimize=false]
 * @constructor
 */
function WrapperPlugin(args) {
	if (typeof args !== 'object') {
		throw new TypeError('Argument "args" must be an object.');
	}

	this.header = args.hasOwnProperty('header') ? args.header : '';
	this.footer = args.hasOwnProperty('footer') ? args.footer : '';
	this.test = args.hasOwnProperty('test') ? args.test : '';
	this.runAfterOptimize = args.hasOwnProperty('runAfterOptimize') ? args.runAfterOptimize : false;
}

function apply(compiler) {
	var header = this.header;
	var footer = this.footer;
	var tester = {test: this.test};
	var runAfterOptimize = this.runAfterOptimize

	compiler.plugin('compilation', function (compilation) {
		if (runAfterOptimize)
			compilation.plugin('after-optimize-chunk-assets', function (chunks) {
				wrapChunks(compilation, chunks, footer, header);
			})
		else
			compilation.plugin('optimize-chunk-assets', function (chunks, done) {
				wrapChunks(compilation, chunks, footer, header);
				done();
			})
	});

	function wrapFile(compilation, fileName) {
		var headerContent = (typeof header === 'function') ? header(fileName) : header;
		var footerContent = (typeof footer === 'function') ? footer(fileName) : footer;

		compilation.assets[fileName] = new ConcatSource(
				String(headerContent),
				compilation.assets[fileName],
				String(footerContent));
	}

	function wrapChunks(compilation, chunks) {
		chunks.forEach(function (chunk) {
			chunk.files.forEach(function (fileName) {
				if (ModuleFilenameHelpers.matchObject(tester, fileName)) {
					wrapFile(compilation, fileName);
				}
			});
		});
	}
}

Object.defineProperty(WrapperPlugin.prototype, 'apply', {
	value: apply,
	enumerable: false
});

module.exports = WrapperPlugin;
