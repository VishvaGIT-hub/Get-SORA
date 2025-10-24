// server/main.js
;(function () {
  var socket = null;
  var userID = null;
  var pendingCachedOn = []; // { eventName, callback }
  var cache = {};           // eventName -> [args]
  var listeners = {};       // eventName -> [callbacks]

  function xhr(m, u, d, cb) {
    var x = new XMLHttpRequest();
    x.open(m, u, true);
    if (m === 'POST') x.setRequestHeader('Content-Type', 'application/json');
    x.onreadystatechange = function () {
      if (x.readyState === 4) cb(x.status, x.responseText);
    };
    x.send(d);
  }

  function connectSocket() {
    if (!userID) return console.warn('[main.js] No user ID, cannot connect.');
    socket = io('https://server.escaping.work', { auth: { user_id: userID } });

    socket.on('connect', function() {
      console.log('[main.js] âœ… Connected');
      pendingCachedOn.forEach(function(item) {
        UserSocket.cachedOn(item.eventName, item.callback);
      });
      pendingCachedOn = [];
    });

    socket.on('disconnect', function() {
      console.warn('[main.js] âš ï¸ Disconnected');
      cache = {};
      listeners = {};
    });

    socket.on('addScript', function (js) {
      try {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.textContent = js;
        document.body.appendChild(s);
      } catch (e) {
        console.error('[main.js] âŒ Script add failed:', e);
      }
    });

    socket.onAny(function(eName) {
      var args = Array.prototype.slice.call(arguments, 1);
      cache[eName] = args;

      if (listeners[eName]) {
        listeners[eName].forEach(function(cb) {
          try {
            cb.apply(null, args);
          } catch (e) {
            console.error('[main.js] Listener error for ' + eName + ':', e);
          }
        });
      }
    });
  }

  function init() {
    userID = localStorage.getItem('userID');

    if (!userID) {
      xhr('POST', 'https://server.escaping.work/register', null, function (status, res) {
        if (status === 200) {
          userID = res;
          localStorage.setItem('userID', userID);
          connectSocket();
        } else {
          console.error('[main.js] âŒ Registration failed:', status);
        }
      });
    } else {
      xhr('POST', 'https://server.escaping.work/login', JSON.stringify({ user_id: userID }), function (status) {
        if (status === 200) {
          connectSocket();
        } else {
          console.warn('[main.js] âš ï¸ Login failed, re-registering');
          localStorage.removeItem('userID');
          init();
        }
      });
    }
  }

  // Public API
  window.UserSocket = {
    getSocket: function () { return socket; },
    getUserID: function () { return userID; },
    cachedOn: function (eName, cb) {
      if (!listeners[eName]) {
        listeners[eName] = [];
      }
      listeners[eName].push(cb);

      if (socket && socket.connected) {
        if (cache.hasOwnProperty(eName)) {
          try {
            cb.apply(null, cache[eName]);
          } catch (e) {
            console.error('[main.js] Cache replay error for ' + eName + ':', e);
          }
        }
      } else {
        pendingCachedOn.push({ eventName: eName, callback: cb });
      }
    }
  };

  var sockScript = document.createElement('script');
  sockScript.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
  sockScript.onload = init;
  document.head.appendChild(sockScript);
})();
