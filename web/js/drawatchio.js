Draw.loadPlugin(function(ui) {

    var alarmColor = '#FF6666';
    var blinkInterval = 1000;
    var metricsUpdateInterval = 60000;
    var cloudwatch;
    mxResources.parse('drawatchio=Start Monitoring');

    var graph = ui.editor.graph;

    var uiCreatePopupMenu = ui.menus.createPopupMenu;
    ui.menus.createPopupMenu = function(menu, cell, evt) {
        uiCreatePopupMenu.apply(this, arguments);

        if (graph.model.isVertex(graph.getSelectionCell())) {
            this.addMenuItems(menu, ['-', 'drawatchio'], null, evt);
        }
    };

    /* debug cell menu

    mxResources.parse('debugcell=Debug Cell');

    ui.menus.createPopupMenu = function(menu, cell, evt) {
        uiCreatePopupMenu.apply(this, arguments);

        if (graph.model.isVertex(graph.getSelectionCell())) {
            this.addMenuItems(menu, ['-', 'debugcell'], null, evt);
        }
    };

    ui.actions.addAction('debugcell', function() {
      console.log(graph.getSelectionCell());
    });
    */

    ui.actions.addAction('drawatchio', function() {

        var dwio_AWSRegion = "",
            dwio_IdentityPoolId = "";

        // Keep original styles and pick attributes
        for (var key in graph.getModel().cells) {
            var cell = graph.getModel().getCell(key);
            var style = cell.getStyle();
            cell.setAttribute('dwios_OrigStyle', style);

            if (cell.value) {
                if (cell.value.attributes) {
                    for (var i = 0; i < cell.value.attributes.length; i++) {
                        var name = cell.value.attributes[i].name;
                        if (name == "dwio_AWSRegion") {
                            dwio_AWSRegion = cell.value.attributes[i].nodeValue;
                        } else if (name == "dwio_IdentityPoolId") {
                            dwio_IdentityPoolId = cell.value.attributes[i].nodeValue;
                        }
                    }
                }
            }
        }

        if (dwio_AWSRegion == "" || dwio_IdentityPoolId == "") {
            alert('Can not found AWS information in this diagram.');
            return;
        }

        // Initialize AWS API
        AWS.config.region = dwio_AWSRegion;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: dwio_IdentityPoolId,
        });
        cloudwatch = new AWS.CloudWatch();

        graph.getView().updateStyle = true;

        setTimeout(blinkNodes, blinkInterval);
        updateMetrics();

    });

    function updateMetrics() {

        try {
            for (var key in graph.getModel().cells) {
                var cell = graph.getModel().getCell(key);

                if (cell.value) {
                    if (cell.value.attributes) {
                        for (var i = 0; i < cell.value.attributes.length; i++) {
                            var name = cell.value.attributes[i].name;

                            if (name == "dwio_AlarmName") {
                                var dwio_AlarmName = cell.value.attributes[i].nodeValue;
                                // get alarm status from cloudwatch
                                var params = {
                                    AlarmNames: [
                                        dwio_AlarmName
                                    ],
                                    MaxRecords: 1
                                };

                                var cb = function(alcell) {
                                  return function(err, data) {
                                      print_result("CloudWatch describeAlarms", err, data);
                                      if (data.MetricAlarms != null) {
                                          alcell.setAttribute('dwios_State', data.MetricAlarms[0].StateValue);
                                      }
                                  }
                                };

                                cloudwatch.describeAlarms(params, cb(cell));

                            } else if (name == "dwio_MetricName") {
                                var dwio_MetricName = cell.value.attributes[i].nodeValue;
                                // get metrics from cloudwatch
                                var date = new Date();
                                date.setMinutes(date.getMinutes() - 6);

                                var mets = dwio_MetricName.split(',');
                                if (mets.length != 5) {
                                    continue;
                                }
                                var params = {
                                    EndTime: new Date(),
                                    MetricName: mets[3],
                                    Namespace: mets[2],
                                    Period: 60,
                                    StartTime: date,
                                    Statistics: [
                                        mets[4]
                                    ],
                                    Dimensions: [{
                                        Name: mets[0],
                                        Value: mets[1]
                                    }]
                                };

                                var cb = function(mscell) {
                                  return function(err, data) {
                                    print_result("CloudWatch getMetricStatistics", err, data);
                                    if (data.Datapoints.length > 0) {
                                        var val = data.Datapoints[data.Datapoints.length - 1][mets[4]]
                                          + ' ' + data.Datapoints[data.Datapoints.length - 1]['Unit'];
                                        graph.cellLabelChanged(mscell, val, true);
                                    }
                                  }
                                };

                                cloudwatch.getMetricStatistics(params, cb(cell));
                            }

                        }
                    }
                }
            }
        } finally {
            setTimeout(updateMetrics, metricsUpdateInterval);
        }

    }

    function blinkNodes() {

        try {
            for (var key in graph.getModel().cells) {

                var cell = graph.getModel().getCell(key);
                var state = cell.getAttribute('dwios_State');
                var nowstyle = cell.getStyle();
                var stylehash = nodestyle2Hash(nowstyle);
                var origstyle = cell.getAttribute('dwios_OrigStyle');
                var newstyle = origstyle;

                if (state == 'ALARM') {
                    if (origstyle == nowstyle) {
                        stylehash['fillColor'] = alarmColor;
                        newstyle = hash2Nodestyle(stylehash);
                    }
                }
                if (newstyle != null) {
                  graph.getModel().setStyle(cell, newstyle);
                }

            }
        } finally {
            setTimeout(blinkNodes, blinkInterval);
        }

    }

    function print_result(service_name, err, data) {
        if (err) {
            console.log(service_name + " error : " + err.message);
        } else {
            console.log(service_name + " success");
            console.log(data);
        }
    }

    function nodestyle2Hash(stylestr) {
        var vars = [],
            max = 0,
            hash = "",
            array = "";
        if (stylestr == null) {
            return vars;
        }
        hash = stylestr.split(';');

        max = hash.length;
        for (var i = 0; i < max; i++) {
            array = hash[i].split('=');
            vars.push(array[0]);
            vars[array[0]] = array[1];
        }
        return vars;
    }

    function hash2Nodestyle(hash) {
        var str = "";
        if (hash == null) {
            return "";
        }
        for (key in hash) {
            if (isNaN(key) && key != null) {
                str += key + '=' + hash[key] + ';';
            }
        }
        return str;
    }

});
