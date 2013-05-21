console.log('control panel loaded');
console.log('foo');

var app = angular.module('walkthrumaker', []);

app.service('Message', function() {
    this.send = function(name, data) {
        chrome.extension.sendMessage({
            name: name,
            data: data
        });
    };
})


app.service('Background', function(Message) {
    this.focusMyTab = function() {
        Message.send('cpanel.focusMyTab');
    }
});


app.controller('DummyCtrl', function($scope, Background) {
    $scope.focusMyTab = function() {
        Background.focusMyTab();
    }
});