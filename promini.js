/**
 * promise-minimal
 */

function Promini(func) {
  if (!(this instanceof Promini)) return new Promini(func);
  var that = this;
  var onFulfill = gen(1);
  var onReject = gen(2);
  try {
    func(onFulfill, onReject);
  } catch (e) {
    onReject(e);
  }

  function gen(stat) {
    return function(result) {
      // 2.3.2: If `x` is a promise, adopt its state
      try {
        var then = ("object" === typeof result && result != null) && result.then;
        if ("function" === typeof then) {
          return then.call(result, onFulfill, onReject);
        }
      } catch (e) {
        return onReject(e);
      }

      // 2.1.2.1: When fulfilled, a promise:
      // must not transition to any other state.
      // must have a value, which must not change.
      if (that._stat) return;

      that._stat = stat;
      that._result = result;
      if (that._subscribers) setTimeout(runAll, 0);
    };
  }

  function runAll() {
    var subscribers = that._subscribers;
    while (subscribers && subscribers.length) {
      var job = subscribers.shift();
      if (job) job();
    }
  }
}

(function(exports, Promini) {
  var FUNCTION = "function";

  exports.Promini = Promini;

  Promini.prototype.then = function(onFulfilled, onRejected) {
    var afterFulfill, afterReject;
    var that = this;
    if (FUNCTION !== typeof onFulfilled) onFulfilled = 0;
    if (FUNCTION !== typeof onRejected) onRejected = 0;
    var promise = new Promini(function(res, rej) {
      afterFulfill = res;
      afterReject = rej;
      var subscribers = that._subscribers;
      if (that._stat && !(subscribers && subscribers.length)) {
        return setTimeout(job, 0);
      }
      if (!subscribers) {
        subscribers = that._subscribers = [];
      }
      subscribers.push(job);
    });
    return promise;

    function job() {
      var result = that._result;
      try {
        if (that._stat === 2) {
          if (onRejected) {
            result = onRejected(result);
          } else {
            return afterReject(result);
          }
        } else if (onFulfilled) {
          result = onFulfilled(result);
        }

        // 2.3.1: If `promise` and `x` refer to the same object,
        // reject `promise` with a `TypeError' as the reason.
        if (result === promise) {
          return afterReject(new TypeError());
        }

        afterFulfill(result);
      } catch (e) {
        afterReject(e);
      }
    }
  };

  Promini.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promini.resolve = function(result) {
    return new Promini(function(onFulfilled) {
      return onFulfilled(result);
    });
  };

  Promini.reject = function(reason) {
    return new Promini(function(onFulfilled, onRejected) {
      return onRejected(reason);
    });
  };

})("undefined" !== typeof exports && exports || this || {}, Promini);
