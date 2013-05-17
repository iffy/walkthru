var running_tabs = {};

function injectJs(tab_id, files) {
    if (files.length) {
        chrome.tabs.executeScript(tab_id, {file: files.shift()}, function() {
            injectJs(tab_id, files);
        });
    }
}
function start(tab_id) {
    console.log('start');
    chrome.windows.create({'url': 'index.html', 'type': 'popup' }, function() {});
    chrome.tabs.insertCSS(tab_id, {file: 'walkthru.css'});
    chrome.tabs.insertCSS(tab_id, {file: 'extension.css'});
    injectJs(tab_id, ['jquery.js', 'angular.js', 'd3.v3.min.js', 'walkthru.js', 'extension.js']);
    if (!running_tabs[tab_id]) {
        running_tabs[tab_id] = true;
    }
}
function stop(tab_id) {
    delete running_tabs[tab_id];
    chrome.tabs.executeScript(tab_id, {code: 'stopApp()'});
}




function req_save(sender, data) {
    console.log('req_save(..., ' + data + ')');
    console.log(data);
    console.log(running_tabs);
    var filename = data.name;

    // Associate the tab with the saved data
    running_tabs[sender.tab.id] = filename;

    // Save the data
    console.log(localStorage);
    localStorage[filename] = JSON.stringify(data);
    console.log(localStorage);
}

function req_load(sender, data) {
    console.log('req_load(..., ' + data + ')');
    console.log(data);
    console.log(running_tabs);

    // Decide what to load
    var filename;
    if (data.name != null) {
        filename = data.name;
    } else {
        // no name, load the current one
        var current_filename = running_tabs[sender.tab.id];
        if (current_filename && current_filename !== true) {
            filename = current_filename;
        }
    }
    console.log('loading filename: ' + filename);

    // Load it
    var saved_data = localStorage[filename];
    console.log('loading');
    console.log(saved_data);

    if (saved_data) {
        return JSON.parse(saved_data);
    } else {
        // nothing saved
        return {};
    }
}



function receiveRequest(sender, message_type, data) {
    if (message_type == 'save') {
        return req_save(sender, data);
    } else if (message_type == 'load') {
        return req_load(sender, data);
    }
}

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    $.when(receiveRequest(sender, message.type, message.data)).then(sendResponse);
})

chrome.tabs.onUpdated.addListener(function(tabid, change, tab) {
    // Keep going even when moving to new tab
    if (change.status == 'complete') {
        if (running_tabs[tab.id]) {
            start(tab.id);
        }
    }
})
chrome.browserAction.onClicked.addListener(function(tab) {
    if (running_tabs[tab.id]) {
        stop(tab.id);
    } else {
        start(tab.id);
    }
});