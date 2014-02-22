var http = require('http');
var Q = require('q');

var axe = (function() {
	var httpAgent = new http.Agent({maxSockets: 30});

	var createRequest = function(page) {
		var deferred = Q.defer();
		var options = {
			hostname: 'axe-level-4.herokuapp.com',
			port: 80,
			path: '/lv4/?page=' + page,
			method: 'GET',
			agent: httpAgent,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36',
				'Referer': 'http://axe-level-4.herokuapp.com/lv4/'
			}
		};

		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			var html = '';
			res.on('data', function (chunk) {
				html += chunk;
			});
			res.on('end', function() {
				deferred.resolve(html);
			});
		});
		req.write('data\n');
		req.end();
		return deferred.promise;
	};
	var createPromises = function(page) {
		var i;
		var reqs = [];
		for(i = 1;i <= page;i++) {
				reqs.push(createRequest(i));
		}
		return reqs;
	};
	var parser = function(value) {
		var reg  =/<tr>[\s]+<td>([\s\S]+?)<\/td>[\s]+<td>([\s\S]+?)<\/td>[\s]+<td>([\s\S]+?)<\/td>[\s]+<\/tr>/mg;
		var match;
		var i = 0;
		var rows = [];
		while(match = reg.exec(value)) {
			i++;
			if(i == 1) {
				continue;
			}
			rows.push({town: match[1], village: match[2], name: match[3]});
		}
		return rows;
	};
	return {
		start: function(page) {
			var deferred = Q.defer();
			var promises = createPromises(page);
			var rows = [];
			Q.allSettled(promises).then(function(results) {
				for(var j in results) {
					var value = results[j].value;
					rows = rows.concat(parser(value));
				}
				deferred.resolve(rows);
			});
			return deferred.promise;
		}
	};
})();

axe.start(24).then(function(data) {
	console.log(JSON.stringify(data, null));
});







