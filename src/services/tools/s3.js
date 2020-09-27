const 
    AWS = require('aws-sdk'),
    S3 = new AWS.S3({
        useAccelerateEndpoint: true
    });

module.exports = {
    S3: S3
}