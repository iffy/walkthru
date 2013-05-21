var tab_control_panels = {};
var control_panel_tabs = {};

function injectJs(tab, files) {
    if (files.length) {
        chrome.tabs.executeScript(tab.id, {file: files.shift()}, function() {
            injectJs(tab, files);
        });
    }
}

//
// Start a control panel for a tab.
// 
function start(tab) {
    console.log(tab);
    chrome.windows.create({
        'url': 'controlpanel.html',
        'type': 'popup',
        'width': 300,
        'height': 600
    }, function(y) {
        tab_control_panels[tab] = y.tabs[0];
        control_panel_tabs[y.tabs[0]] = tab;
    });
    
    chrome.tabs.insertCSS(tab.id, {file: 'walkthru.css'});
    injectJs(tab, ['jquery.js', 'walkthru.js', 'client.js']);
}
//
// Focus on a control panel for a tab
//
function focusTabForPanel(control_panel) {
    var tab = control_panel_tabs[control_panel];
    if (tab == undefined) {
        return;
    }
    console.log('focusing tab');
    chrome.tabs.update(tab.id, {selected: true});
}

//
//
//
function stop(tab) {
    //delete running_tabs[tab];
    //chrome.tabs.executeScript(tab, {code: 'stopApp()'});
}


function messageReceived(sender, message) {
    var tab = sender.tab;
    if (message.name == 'cpanel.focusMyTab') {
        focusTabForPanel(tab);
        console.log(sender);
        console.log(message);
    }
}

//
// Message from children
//
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    $.when(messageReceived(sender, message)).then(sendResponse);
})

//
// 
//
chrome.tabs.onUpdated.addListener(function(tabid, change, tab) {
    // Keep going even when moving to new tab
    if (change.status == 'complete') {
    }
})

//
// The extension button is clicked
//
chrome.browserAction.onClicked.addListener(function(tab) {
    if (tab_control_panels[tab]) {
        // The extension is running already, focus on it.
        stop(tab);
    } else {
        start(tab);
    }
});