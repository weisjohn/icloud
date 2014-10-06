
// heavily inspired by pycloud - https://github.com/picklepete/pyicloud/

var request = require('request');
var uuid = require('node-uuid');
var _ = require('lodash');

// configuration
var setup = 'https://p12-setup.icloud.com/setup/ws/1';
var conf = {
    home : 'https://www.icloud.com',
    setup : setup,
    login : setup + "/login",
    validate : setup + "/validate",
}

module.exports = function() {

    // default request object
    var req = request.defaults({ 
        headers : {
            'host': 'setup.icloud.com',
            'origin' : conf.home,
            'referer' : conf.home,
            'User-Agent': 'Opera/9.52 (X11; Linux i686; U; en)'
        },
        jar : true,
        json : true
    });

    // store various request meta credentials 
    var session = { params : {
        clientBuildNumber : '14FPlus30',
        clientId : uuid.v1().toUpperCase(),
    } };

    /*
    Queries the /validate endpoint and fetches two key values we need:
    1. "dsInfo" is a nested object which contains the "dsid" integer.
        This object doesn't exist until *after* the login has taken place,
        the first request will compain about a X-APPLE-WEBAUTH-TOKEN cookie
    */
    function refresh_validate(cb) {

        // make the request via the session params
        req.get({ 
            url : conf.validate,
            qs : session.params
        }, function(err, resp, data) {
            if (err) return cb(err);

            // capture the dsid 
            if (data.dsInfo) { session.params.dsid = data.dsInfo.dsid; }

            cb(null);
        });
    }


    function login(apple_id, password, cb) {
        
        // store the user info
        session.user = { 
            apple_id : apple_id,
            password : password
        }

        // validate before login
        refresh_validate(function(err, results) {
            if (err) return cb(err);

            // craft data for login request
            var data = _.clone(session.user);
            data.id = session.params.id;
            data.extended_login = false;

            // login request
            req.post({ 
                url : conf.login,
                qs : session.params,
                json: data
            }, function(err, resp, data) {
                if (err || data.error) 
                    return cb("Invalid email/password combination.");

                // store the results
                session.discovery = data;
                session.webservices = data.webservices;

                // refresh after login
                refresh_validate(cb);
            });
        });
    }

    // fetch contacts
    function contacts(cb) {
        if (!session.webservices || !session.webservices.contacts)
            return cb("No webservice found for contacts");

        var params = _.extend({}, session.params, {
            clientVersion : "2.1",
            locale : "en_US",
            order : "last,first",
        });

        var url = session.webservices.contacts.url.replace(':443', '');

        req.get({
            url : session.webservices.contacts.url + "/co/startup",
            qs : params,
            headers : {
                host : session.webservices.contacts.url.split('//')[1].split(':')[0],
            }
        }, function(err, resp, body) {
            if (err) return cb(err);
            cb(null, body);
        });
    }

    return {
        login: login,
        contacts:  contacts
    }

}
