const 
    AWS = require('aws-sdk'),
    S3 = new AWS.S3({
        region: 'us-east-1',
        sslEnabled: true,
    });

module.exports = {
    S3: S3
}