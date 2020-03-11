##

https://mysqlserverteam.com/mysql-8-0-4-new-default-authentication-plugin-caching_sha2_password/

```js
const mysql = require('mysql');
mysql.createConnection({
  authPlugins: {
    caching_sha2_password: mysql.authPlugins.caching_sha2_password({
      onServerPublikKey: function(key) {
        console.log(key);
      },
      serverPublicKey: 'xxxyyy',
      overrideIsSecure: true //
    })
  }
});
```
