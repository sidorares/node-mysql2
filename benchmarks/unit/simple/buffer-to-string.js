var a = new Buffer(10000);
a.fill(120); // 'x'
var l = 5;
var s = '';
var repeats = 10000;

module.exports = function(next) {
  for (var n=0; n < repeats; ++n) {
    for (var i=0; i < a.length - l; ++i) {
      s = s.toString('utf8', i, i+l);
    }
  }
  next();
};

module.exports.comment = 'read ' + l + ' chars strings from ' + a.length + ' bytes buffer x ' + repeats;
