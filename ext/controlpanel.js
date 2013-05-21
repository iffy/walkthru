var app = angular.module('walkthrumaker', []);

app.service('Message', function($rootScope, $q) {
    this.send = function(name, data) {
        var d = $q.defer();
        chrome.extension.sendMessage({
            name: name,
            data: data
        }, function(response) {
            $rootScope.$apply(function() {
                d.resolve(response);
            })
        });
        return d.promise;
    };

    this._receivers = {};
    this.registerReceiver = function(name, func) {
        this._receivers[name] = func;
    }

    chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
        console.log('message received');
        console.log(message);
        var func = this._receivers[message.name];
        if (func) {
            return $.when(function() {
                return $rootScope.$apply(function() {
                    return func(message.data);
                });
            }()).then(sendResponse);

            //return $.when(func(message.data)).then(sendResponse);
        }
        return true;
    }.bind(this));
});


app.service('SlaveData', function() {
    return {
        title: 'unknown',
        mode: null
    }
})

app.service('Slave', function($rootScope, Message, SlaveData) {
    // Send a message to the slave by way of the background process.
    this.send = function(name, data) {
        return Message.send('other', {
            name: name,
            data: data
        })
    };

    this.data = SlaveData;

    this.getTitle = function() {
        return this.send('getTitle');
    };

    this.setMode = function(what) {
        return this.send('setMode', {
            'mode': what
        })
    }
    this.getTitle();

    Message.registerReceiver('slave:load', function(data) {
        this.getTitle();
    }.bind(this));

    Message.registerReceiver('slave.title:update', function(data) {
        this.data.title = data;
    }.bind(this));
    
    Message.registerReceiver('slave.mode:update', function(data) {
        this.data.mode = data;
    }.bind(this));
});


app.service('Background', function(Message) {
    this.focusMyTab = function() {
        Message.send('focusMyTab');
    }
});


app.controller('DummyCtrl', function($scope, Background, Slave) {
    $scope.focusMyTab = function() {
        Background.focusMyTab();
    };
    $scope.setMode = function(mode) {
        Slave.setMode(mode);
    }
    $scope.slave = Slave.data;
});