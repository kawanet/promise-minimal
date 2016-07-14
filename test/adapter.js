'use strict';

var Promini = require('../').Promini;

exports.resolved = Promini.resolve;

exports.rejected = Promini.reject;

exports.deferred = function() {
  var deferred = {};
  deferred.promise = new Promini(function(resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};
