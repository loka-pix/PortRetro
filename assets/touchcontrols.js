var TouchControls = (function() {
    var container;
    var activeKeys = {};
    var analogSticks = {};
    var enabled = false;
    var currentLayout = 'default';

    var keyMap = {
        'start': 'Enter',
        'select': ' ',
        'l': 'e',
        'l2': 'r',
        'r': 'p',
        'r2': 'o',
        'a': 'h',
        'b': 'g',
        'x': 'y',
        'y': 't',
        'up': 'ArrowUp',
        'down': 'ArrowDown',
        'left': 'ArrowLeft',
        'right': 'ArrowRight',
        'l_x_minus': 'a',
        'l_x_plus': 'd',
        'l_y_minus': 'w',
        'l_y_plus': 's',
        'l3': 'x',
        'r_x_minus': 'j',
        'r_x_plus': 'l',
        'r_y_minus': 'i',
        'r_y_plus': 'k',
        'r3': ',',
        'menu': 'F1',
        'save_state': 'F2',
        'load_state': 'F3',
        'screenshot': 'F4'
    };

    function simulateKeyPress(key, press) {
        var event = new KeyboardEvent(press ? 'keydown' : 'keyup', {
            key: key,
            code: 'Key' + key.toUpperCase(),
            keyCode: key.charCodeAt(0),
            which: key.charCodeAt(0),
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    function pressButton(buttonId) {
        if (activeKeys[buttonId]) return;
        activeKeys[buttonId] = true;
        
        var key = keyMap[buttonId];
        if (key) {
            simulateKeyPress(key, true);
        }
    }

    function releaseButton(buttonId) {
        if (!activeKeys[buttonId]) return;
        activeKeys[buttonId] = false;
        
        var key = keyMap[buttonId];
        if (key) {
            simulateKeyPress(key, false);
        }
    }

    function createButton(id, label, x, y) {
        var btn = document.createElement('div');
        btn.className = 'touch-button';
        btn.textContent = label;
        btn.style.left = x;
        btn.style.bottom = y;
        btn.dataset.buttonId = id;
        
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            btn.classList.add('pressed');
            pressButton(id);
        }, {passive: false});
        
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
            releaseButton(id);
        }, {passive: false});
        
        btn.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            btn.classList.remove('pressed');
            releaseButton(id);
        }, {passive: false});
        
        return btn;
    }

    function createDPad(x, y) {
        var dpad = document.createElement('div');
        dpad.className = 'touch-dpad';
        dpad.style.left = x;
        dpad.style.bottom = y;
        
        var directions = [
            {id: 'up', class: 'touch-dpad-up', label: '▲'},
            {id: 'down', class: 'touch-dpad-down', label: '▼'},
            {id: 'left', class: 'touch-dpad-left', label: '◄'},
            {id: 'right', class: 'touch-dpad-right', label: '►'}
        ];
        
        directions.forEach(function(dir) {
            var btn = document.createElement('div');
            btn.className = 'touch-dpad-btn ' + dir.class;
            btn.textContent = dir.label;
            btn.dataset.buttonId = dir.id;
            
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                btn.classList.add('pressed');
                pressButton(dir.id);
            }, {passive: false});
            
            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                btn.classList.remove('pressed');
                releaseButton(dir.id);
            }, {passive: false});
            
            btn.addEventListener('touchcancel', function(e) {
                e.preventDefault();
                btn.classList.remove('pressed');
                releaseButton(dir.id);
            }, {passive: false});
            
            dpad.appendChild(btn);
        });
        
        var center = document.createElement('div');
        center.className = 'touch-dpad-center';
        dpad.appendChild(center);
        
        return dpad;
    }

    function createAnalog(id, x, y) {
        var analog = document.createElement('div');
        analog.className = 'touch-analog';
        analog.style.left = x;
        analog.style.bottom = y;
        analog.dataset.analogId = id;
        
        var stick = document.createElement('div');
        stick.className = 'touch-analog-stick';
        analog.appendChild(stick);
        
        var centerX = 60;
        var centerY = 60;
        var maxDistance = 35;
        
        var currentTouch = null;
        var activeDirections = {};
        
        function updateStickPosition(touch) {
            var rect = analog.getBoundingClientRect();
            var x = touch.clientX - rect.left - centerX;
            var y = touch.clientY - rect.top - centerY;
            
            var distance = Math.sqrt(x * x + y * y);
            if (distance > maxDistance) {
                x = x / distance * maxDistance;
                y = y / distance * maxDistance;
            }
            
            stick.style.transform = 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px))';
            
            var threshold = 15;
            var newDirections = {
                x_minus: x < -threshold,
                x_plus: x > threshold,
                y_minus: y < -threshold,
                y_plus: y > threshold
            };
            
            for (var dir in newDirections) {
                var buttonId = id + '_' + dir;
                if (newDirections[dir] && !activeDirections[dir]) {
                    pressButton(buttonId);
                    activeDirections[dir] = true;
                } else if (!newDirections[dir] && activeDirections[dir]) {
                    releaseButton(buttonId);
                    activeDirections[dir] = false;
                }
            }
        }
        
        function resetStick() {
            stick.style.transform = 'translate(-50%, -50%)';
            for (var dir in activeDirections) {
                if (activeDirections[dir]) {
                    releaseButton(id + '_' + dir);
                    activeDirections[dir] = false;
                }
            }
        }
        
        analog.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (currentTouch === null) {
                currentTouch = e.changedTouches[0].identifier;
                updateStickPosition(e.changedTouches[0]);
            }
        }, {passive: false});
        
        analog.addEventListener('touchmove', function(e) {
            e.preventDefault();
            for (var i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === currentTouch) {
                    updateStickPosition(e.changedTouches[i]);
                    break;
                }
            }
        }, {passive: false});
        
        analog.addEventListener('touchend', function(e) {
            e.preventDefault();
            for (var i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === currentTouch) {
                    currentTouch = null;
                    resetStick();
                    break;
                }
            }
        }, {passive: false});
        
        analog.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            currentTouch = null;
            resetStick();
        }, {passive: false});
        
        return analog;
    }

    function createMenuButtons() {
        var menuDiv = document.createElement('div');
        menuDiv.className = 'touch-menu-buttons';
        
        var buttons = [
            {id: 'menu', label: 'MENU'},
            {id: 'save_state', label: 'SAVE'},
            {id: 'load_state', label: 'LOAD'}
        ];
        
        buttons.forEach(function(btnData) {
            var btn = document.createElement('div');
            btn.className = 'touch-menu-btn';
            btn.textContent = btnData.label;
            
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                pressButton(btnData.id);
            }, {passive: false});
            
            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                releaseButton(btnData.id);
            }, {passive: false});
            
            menuDiv.appendChild(btn);
        });
        
        return menuDiv;
    }

    function createShoulderButtons(side, buttons) {
        var shoulderDiv = document.createElement('div');
        shoulderDiv.className = 'touch-shoulder-buttons touch-shoulder-' + side;
        
        buttons.forEach(function(btnData) {
            var btn = document.createElement('div');
            btn.className = 'touch-shoulder-btn';
            btn.textContent = btnData.label;
            
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                btn.classList.add('pressed');
                pressButton(btnData.id);
            }, {passive: false});
            
            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                btn.classList.remove('pressed');
                releaseButton(btnData.id);
            }, {passive: false});
            
            btn.addEventListener('touchcancel', function(e) {
                e.preventDefault();
                btn.classList.remove('pressed');
                releaseButton(btnData.id);
            }, {passive: false});
            
            shoulderDiv.appendChild(btn);
        });
        
        return shoulderDiv;
    }

    function buildDefaultLayout() {
        container.innerHTML = '';
        
        container.appendChild(createMenuButtons());
        
        container.appendChild(createShoulderButtons('left', [
            {id: 'l', label: 'L'},
            {id: 'l2', label: 'L2'}
        ]));
        
        container.appendChild(createShoulderButtons('right', [
            {id: 'r2', label: 'R2'},
            {id: 'r', label: 'R'}
        ]));
        
        container.appendChild(createDPad('20px', '120px'));
        
        container.appendChild(createAnalog('l', '20px', '300px'));
        
        container.appendChild(createButton('y', 'Y', 'calc(100% - 180px)', '200px'));
        container.appendChild(createButton('x', 'X', 'calc(100% - 140px)', '240px'));
        container.appendChild(createButton('b', 'B', 'calc(100% - 220px)', '240px'));
        container.appendChild(createButton('a', 'A', 'calc(100% - 180px)', '280px'));
        
        container.appendChild(createAnalog('r', 'calc(100% - 140px)', '80px'));
        
        var startBtn = createButton('start', 'START', 'calc(50% + 40px)', '20px');
        startBtn.style.width = '80px';
        startBtn.style.borderRadius = '8px';
        container.appendChild(startBtn);
        
        var selectBtn = createButton('select', 'SELECT', 'calc(50% - 120px)', '20px');
        selectBtn.style.width = '80px';
        selectBtn.style.borderRadius = '8px';
        container.appendChild(selectBtn);
    }

    function init() {
        container = document.createElement('div');
        container.id = 'touch-controls-container';
        document.body.appendChild(container);
        
        buildDefaultLayout();
        
        var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            enable();
        }
    }

    function enable() {
        enabled = true;
        container.classList.add('active');
    }

    function disable() {
        enabled = false;
        container.classList.remove('active');
        
        for (var key in activeKeys) {
            if (activeKeys[key]) {
                releaseButton(key);
            }
        }
    }

    function toggle() {
        if (enabled) {
            disable();
        } else {
            enable();
        }
    }

    function isEnabled() {
        return enabled;
    }

    return {
        init: init,
        enable: enable,
        disable: disable,
        toggle: toggle,
        isEnabled: isEnabled
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        TouchControls.init();
        updateToggleText();
    });
} else {
    TouchControls.init();
    updateToggleText();
}

function updateToggleText() {
    setTimeout(function() {
        var toggleBtn = document.getElementById('toggletouchcontrols');
        if (toggleBtn && typeof TouchControls !== 'undefined') {
            toggleBtn.textContent = TouchControls.isEnabled() ? '✓ Touch Controls' : 'Touch Controls';
        }
    }, 100);
}
