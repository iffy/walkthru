//
// Add DOM
//
var APPELID = 'div[ng-app="WalkThruMaker"]';

function addDom() {
    var maker_div = $('<div></div>')
        .attr('ng-app', 'WalkThruMaker')
        .addClass('walkthrumaker-container')
        .attr('ng-controller', 'MasterCtrl');
    var controls = $('<controls></controls>')
        .attr('show', 'show');
    maker_div.append(controls);
    var timeline = $('<timeline></timeline>')
        .attr('show', 'show');
    maker_div.append(timeline);

    $(document.body).append(maker_div);
}

//
// App
//

function startApp() {
    var app = angular.module('WalkThruMaker', []);

    app.factory('Message', function() {
        return function(name, data) {
            var d = new $.Deferred();
            chrome.extension.sendMessage({type: name, data: data}, d.resolve);
            return d.promise();
        }
    })

    app.factory('ShowData', function() {
        return {
            last_id: 1,
            active_slide_id: null,
            name: 'No name',
            slides: []
        }
    })

    app.factory('Init', function(ShowData, RemoteData) {
        RemoteData.load().then(function(x) {
            console.log('loaded');
            console.log(x);
            for (k in x) {
                ShowData[k] = x[k];
            }
            console.log(ShowData);
            RemoteData.save();
        })
    })

    app.service('SlideShow', function(ShowData) {
        var data = ShowData;

        this._nextId = function() {
            data.last_id += 1;
            return data.last_id;
        }

        this.addSlide = function() {
            var name = 'Slide ' + (data.slides.length+1);
            var slide = {
                id: this._nextId(),
                name: name
            };
            data.slides.push(slide);
            return slide.id;
        }
    })

    app.service('RemoteData', function(ShowData, Message) {
        this.save = function() {
            console.log('save');
            console.log(ShowData.name);
            return Message('save', ShowData);
        }

        this.load = function(name) {
            console.log('load(' + name + ')');
            if (name == undefined) {
                name = null;
            }
            return Message('load', {
                name: name
            })
        }
        return this;
    })

    app.service('Recorder', function() {
        this.mode = 'idle';

        this.mousedown = function(ev) {
            console.log('mousedown');
        }
        this.mouseup = function(ev) {
            console.log('mouseup');
        }
        this.click = function(ev) {
            console.log('click');
            // if ($(ev.target).closest(APPELID).length > 0) {
            //     return;
            // }
        }
        this.captureMouse = function() {
            $(document).bind('click', this.click.bind(this));
            $(document).bind('mousedown', this.mousedown.bind(this));
            $(document).bind('mouseup', this.mouseup.bind(this));
        }
        this.captureMouse();
    })

    app.controller('MasterCtrl', function($scope, Init, ShowData) {
        $scope.show = ShowData;
    })


    app.directive('controls', function(RemoteData, Recorder, SlideShow) {
        return {
            restrict: 'E',
            template: '<div class="walkthrumaker-controls">' +
                '<button ng-click="textMode()">Text</button>' +
                '<button ng-click="add()">Add</button>' +
                '<input type="text" ng-model="show.name"><button ng-click="save()">Save</button>' +
                '<button ng-click="dump()">Dump</button>' +
            '</div>',
            scope: {
                show: '='
            },
            controller: function($scope) {
                $scope.save = function() {
                    RemoteData.save();
                }
                $scope.textMode = function() {
                    Recorder.mode = 'text';
                }
                $scope.add = function() {
                    var id = SlideShow.addSlide();
                    $scope.show.active_slide_id = id;
                }
                $scope.dump = function() {
                    console.log($scope.show);
                }
            }
        }
    });

    app.directive('timeline', function() {
        return {
            restrict: 'E',
            template: '<div class="walkthrumaker-timeline">' +
                //'<div class="slide" ng-click="select(slide.id)" ng-class="{active:slide.id == show.active_slide_id}" ng-repeat="slide in show.slides">{{ slide.name }}</div>' +
                '<svg width=100 height=100></svg>' +
            '</div>',
            scope: {
                show: '='
            },
            controller: function($scope) {
                $scope.select = function(slide_id) {
                    $scope.show.active_slide_id = slide_id;
                }
            }
        }
    });

    angular.element(document).ready(function() {
        angular.bootstrap(APPELID, ['WalkThruMaker']);
    });
}

function stopApp() {
    $(APPELID).remove();
}

if ($(APPELID).length) {
    // started already
} else {
    // not yet started
    addDom();
    startApp();    
}

