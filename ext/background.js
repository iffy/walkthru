function injectOneJs(tab, file) {
    var d = new $.Deferred();
    chrome.tabs.executeScript(tab.id, {file: file}, d.resolve);
    return d.promise();
}

function injectJs(tab, files) {
    var d = new $.Deferred();
    while (files.length) {
        var x = function(file) {
            d.promise().then(function() {
                return injectOneJs(tab, file);
            });
        }(files.shift());
    }
    d.resolve();
    return d.promise();
}


var _other_side = {};
var _slaves = {};
var _controls = {};

function otherSide(tab) {
    return _other_side[tab.id];
}
function connectTabs(slave, control) {
    _other_side[slave.id] = control;
    _other_side[control.id] = slave;
    _slaves[slave.id] = true;
    _controls[control.id] = true;
}
function isSlave(tab) {
    if (_slaves[tab.id]) {
        return true;
    }
    return false;
}


var _not_ready = {};
//
// Return once the tab is ready
//
function whenReady(tab) {
    if (_not_ready[tab.id]) {
        return _not_ready[tab.id].promise();
    }
    return $.when(null);
}
//
// Signal that a tab is not ready
//
function notReady(tab) {
    if (_not_ready[tab.id]) {
        return;
    }
    _not_ready[tab.id] = new $.Deferred();
}
//
// Signal that a tab is ready
//
function ready(tab) {
    if (_not_ready[tab.id]) {
        var d = _not_ready[tab.id];
        delete _not_ready[tab.id];
        return d.resolve();
    }
}

//
// Start a control panel for a tab.
// 
function start(tab) {
    startClient(tab)
        .then(function() {
            chrome.windows.create({
                'url': 'controlpanel.html',
                'type': 'popup',
                'width': 300,
                'height': 600
            }, function(y) {
                connectTabs(tab, y.tabs[0]);
            });        
        });
}

function startClient(tab) {
    chrome.tabs.insertCSS(tab.id, {file: 'walkthru.css'});
    return $.when(injectJs(tab, ['jquery.js', 'walkthru.js', 'client.js']));
}
//
// Focus on a control panel for a tab
//
function focusTabForPanel(control_panel) {
    var tab = otherSide(control_panel);
    if (tab == undefined) {
        return;
    }
    chrome.tabs.update(tab.id, {selected: true});
}

//
//
//
function stop(tab) {
    //delete running_tabs[tab];
    //chrome.tabs.executeScript(tab, {code: 'stopApp()'});
}


function sendToTab(tab, message) {
    var d = new $.Deferred();
    chrome.tabs.sendMessage(tab.id, message, d.resolve);
    return d.promise();
}


function messageReceived(sender, message) {
    var tab = sender.tab;
    if (message.name == 'focusMyTab') {
        focusTabForPanel(tab);
    } else if (message.name == 'ready') {
        ready(tab);
    } else if (message.name == 'other') {
        var other = otherSide(tab);
        return sendToTab(other, message.data);
    }
}

//
// Message from children
//
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    $.when(messageReceived(sender, message)).then(function(x) {
        sendResponse(x);
    });
    return true;
})

//
// 
//
chrome.tabs.onUpdated.addListener(function(tabid, change, tab) {
    // Keep going even when moving to new tab
    if (change.status == 'complete') {
        if (isSlave(tab)) {
            startClient(tab);
            whenReady(tab).then(function() {
                sendToTab(otherSide(tab), {
                    name: 'slave:load'
                });
            })
        }
    } else if (change.status == 'loading') {
        notReady(tab);
    }
})

//
// The extension button is clicked
//
chrome.browserAction.onClicked.addListener(function(tab) {
    start(tab);
});