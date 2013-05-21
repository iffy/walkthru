var mode = null;

function messageReceived(message) {
    console.log('received');
    console.log(message);
    if (message.name == 'getTitle') {
        return sendMessage('slave.title:update', window.document.title);
    } else if (message.name == 'setMode') {
        mode = message.data.mode;
        return sendMessage('slave.mode:update', message.data.mode);
    }
    return 'unknown message type';
}

function sendMessage(name, data) {
    var d = new $.Deferred();
    chrome.extension.sendMessage({
        name: name,
        data: data
    }, d.resolve);
    return d.promise();
}

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    $.when(messageReceived(message)).then(sendResponse);
    return true;
});

$(window).click(function(ev) {
    if (mode == 'highlight') {
        $(ev.target).walkthru('highlight');
        return false;
    }
})

sendMessage('ready');
