/* Magic Mirror
 * Node Helper: MMM-Fitbit2Friends
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const PythonShell = require("python-shell");

module.exports = NodeHelper.create({

	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "GET DATA") {
			console.log("MMM-Fitbit2Friends: " + payload.trigger + " request to get data received");
			this.getData(payload.config);
		}
	},

	getData: function (config) {
		const self = this;
		let fileName;
		if (config.test) {
			fileName = "test_data.py";
		} else {
			fileName = "get_data.py";
		}

		if (config.debug) {
			console.log("MMM-Fitbit2Friends: Data to receive: " + JSON.stringify(config));
		}
		console.log("MMM-Fitbit2Friends: START " + fileName);

		var pyArgs = []

		if (config.debug) {
			pyArgs.push("--debug")
		}
		if (config.test) {
			pyArgs.push("--test")
		}

		pyArgs.push(config.credentials.clientId)
		pyArgs.push(config.credentials.clientSecret)

		pyArgs.push("--resources")
		pyArgs = pyArgs.concat(config.resources)

		if (config.debug) {
			console.log("MMM-Fitbit2Friends: " + JSON.stringify(pyArgs))
		}

		const fitbitPyShell = new PythonShell(
			fileName, {
				mode: "json",
				scriptPath: "modules/MMM-Fitbit2Friends/python",
				pythonPath: "python3",
				pythonOptions: ["-u"], // get print results in real-time
				args: pyArgs
			}
		);

		fitbitPyShell.on("message", function (message) {
			if (config.debug) {
				console.log("MMM-Fitbit2Friends: Message received: " + JSON.stringify(message))
			}
			if (message.type == "data") {
				message.clientId = config.credentials.clientId
				self.sendSocketNotification("API_DATA_RECEIVED", message);
			}
		});

		fitbitPyShell.end(function (err) {
			if (err) {
				throw err;
			}
			self.sendSocketNotification("UPDATE_VIEW", "Finished getting data from Fitbit API");
			console.log("MMM-Fitbit2Friends: END " + fileName);
		});
	},
});
