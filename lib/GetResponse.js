
'use strict';

var util = require('util'),
	extend = util._extend,
	request = require('request'),
	Utils = require('./Utils');

/**
 *
 * @class GetResponse
 * @namespace GetResponse
 * @param {object} options
 * @param {object} serverOptions
 * @constructor
 *
 * Swagger importer
 */
function GetResponse(options, serverOptions) {
	this.init(options, serverOptions);
}

GetResponse.prototype = extend(GetResponse.prototype, Utils.prototype);
GetResponse.prototype = extend(GetResponse.prototype, {

	constructor : GetResponse,

	_defaults: {
		path: undefined,
		method: undefined,
		expected: undefined,
		serverOptions: undefined
	},

	/**
	 *
	 * @method init
	 * called by constructor
	 * @param {object} options
	 * @param {object} serverOptions
	 * @public
	 */
	init: function (options, serverOptions) {

		options = extend(this._defaults, options || {});

		this._options = options;
		this._serverOptions = serverOptions;
		this._requestData = this._getRequestData();
	},

	/**
	 * @method get
	 * @returns {*}
	 * @public
	 */
	get: function () {
		return this._fetchApiData();
	},

	/**
	 * @method _getUrl
	 * @returns {string}
	 * @private
	 */
	_getUrl: function () {

		var url = [],
			urlOut,
			getParams = [];

		url.push(this._serverOptions.urlPath);
		url.push(this._options.path.replace(this._serverOptions.restPath, '').replace(/#/g, '/'));

		urlOut = this._serverOptions.urlBase + url.join('').replace(/\/\//g, '/');

		// add getParams
		this.forIn(this._requestData, function (key, value) {
			getParams.push(key + '=' + value);
		}.bind(this));

		urlOut += '?_expected=' + this._options.expected + '&' + getParams.join('&');

		return urlOut;
	},

	/**
	 * @method _getRequestData
	 * @returns {object}
	 * @private
	 */
	_getRequestData: function () {

		var path = [],
			data,
			filePath;

		path.push(this._options.path);
		path.push(this._options.method.toUpperCase());
		path.push('mock');
		path.push('.request_data.json');

		filePath = path.join('/');

		if (!this.existFile(filePath)) {
			return {};
		}

		data = this.readFile(filePath);

		try {
			return JSON.parse(data);
		} catch (err) {}

		return data;

	},

	/**
	 * @method _fetchApiData
	 * @returns {*}
	 * @private
	 */
	_fetchApiData: function () {

		var _ = this,
			method = this._options.method.toUpperCase();

		process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

		function AnticipatedSyncFunction(){
			var ret;

			request({
				uri: _._getUrl(),
				method: method || 'GET',
				form: _._requestData
			}, function(error, res, data) {
				if (!error) {

					var newData = data;

					try {
						newData = JSON.parse(data);
					} catch (err) {}

					ret = newData;
				} else {
					ret = {};
				}
			});
			while(ret === undefined) {
				require('deasync').runLoopOnce();
			}
			return ret;
		}

		return AnticipatedSyncFunction();
	}

});

module.exports = GetResponse;