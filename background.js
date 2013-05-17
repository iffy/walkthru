function injectJs(files) {
    if (files.length) {
        chrome.tabs.executeScript(null, {file: files.shift()}, function() {
            injectJs(files);
        });
    }
}
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.insertCSS(null, {file: 'walkthru.css'});
    injectJs(['jquery.js', 'walkthru.js', 'extension.js']);
})