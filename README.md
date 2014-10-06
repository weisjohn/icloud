icloud
======

Access the iCloud API

### usage 

```javascript
var icloud = require('icloud');

var instance = icloud();
instance.login("username", "password", function(err) {
    if (err) return console.log('login failed');
    instance.contacts(function(err, results) {
        if (err) return console.log('failed to fetch contacts');
        console.log(results.contacts);
    });
});
```

### services

Contacts is the only service implemented so far. Pull-requests welcome.


### credits

The implementation is heavily inspired by [pycloud](https://github.com/picklepete/pyicloud/)