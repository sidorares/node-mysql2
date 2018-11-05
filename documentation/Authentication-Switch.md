# Authentication switch request

During connection phase the server may ask client to switch to a different auth method.
If `authSwitchHandler` connection config option is set it must be a function that receive
switch request data and respond via callback. Note that if `mysql_native_password` method is
requested it will be handled internally according to [Authentication::Native41]( https://dev.mysql.com/doc/internals/en/secure-password-authentication.html#packet-Authentication::Native41) and
`authSwitchHandler` won't be invoked. `authSwitchHandler` MAY be called multiple times if
plugin algorithm requires multiple roundtrips of data exchange between client and server.
First invocation always has `({pluginName, pluginData})` signature, following calls - `({pluginData})`.
The client respond with opaque blob matching requested plugin via `callback(null, data: Buffer)`.

Example: (imaginary `ssh-key-auth` plugin) pseudo code

```js
const conn = mysql.createConnection({
  user: 'test_user',
  password: 'test',
  database: 'test_database',
  authSwitchHandler: function ({pluginName, pluginData}, cb) {
    if (pluginName === 'ssh-key-auth') {
      getPrivateKey(key => {
        const response = encrypt(key, pluginData);
        // continue handshake by sending response data
        // respond with error to propagate error to connect/changeUser handlers
        cb(null, response);
      });
    } else {
      const err = new Error(`Unknown AuthSwitchRequest plugin name ${pluginName}`);
      err.fatal = true;
      cb(err);
    }
  }
});
```

Initial handshake always performed using `mysql_native_password` plugin. This will be possible to override in the future versions.
