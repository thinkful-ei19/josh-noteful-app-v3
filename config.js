'use strict';
exports.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/noteful-app';
exports.PORT = process.env.PORT || 8080;
exports.TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost/noteful-app-test';
