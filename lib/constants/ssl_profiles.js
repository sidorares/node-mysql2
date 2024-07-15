'use strict';

const awsCaBundle = require('aws-ssl-profiles');

exports['Amazon RDS'] = {
  ca: awsCaBundle.ca,
};
