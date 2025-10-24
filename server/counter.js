// counter.js
; (function () {
  if (!window.UserSocket || typeof UserSocket.cachedOn !== 'function') {
    console.error('[user-counter.js] âŒ UserSocket.cachedOn not found.');
    return;
  }

  var el = document.createElement('div');
  el.id = 'user-counter';
  el.className = 'user-counter';
  el.textContent = 'Loading users...';
  document.body.appendChild(el);

  var css = `
    .user-counter {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 0 12px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      border-radius: 15px;
      border: 3px solid rgba(0, 0, 0, 0.05);
      transition: opacity 0.2s ease;
      z-index: 9999;
      user-select: none;
      cursor: pointer; /* show it's clickable */
    }
    [data-theme="dark"] .user-counter {
      border-color: rgba(255, 255, 255, 0.05);
    }
  `;

  var style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  // Track click state
  var clickCount = 0;

  el.addEventListener('click', function () {
    clickCount++;
    if (clickCount === 1) {
      el.style.opacity = '0.1'; // fade to almost invisible
    } else if (clickCount === 2) {
      el.remove(); // completely delete element
    }
  });

  UserSocket.cachedOn('userCount', function (count) {
    el.textContent = 'Users online: ' + count;
    console.log('[user-counter.js] User count updated:', count);
  });
})();
