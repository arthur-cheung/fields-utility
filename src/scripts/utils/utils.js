var FieldsUtility = function(node, fields, ajaxFunctions){
    function forEach(list, callback){
        function isNodeList(nodes) {
            var stringRepr = Object.prototype.toString.call(nodes);

            return typeof nodes === 'object' &&
                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr);
        }

        if(Object.prototype.toString.call(list) === '[object Array]'){
            for(var i = 0; !!list && i < list.length; i++){
                callback(list[i], i);
            }
        }
        else if(typeof list == 'object'){
            var isNodeList = isNodeList(list);

            for(var i in list){
                if(!isNodeList || (isNodeList && i != 'length' && i != 'item')){
                    callback(list[i], i);
                }
            }
        }
    }
    var logLevel = 'all';
    function setLogLevel(level){
        logLevel = level;
    }
    var log = {
        app: 'FieldUtilityV2',
        level: 'all',
        setLogLevel: function (level) {
            this.level = level;
        },
        time: function(){
            return '[' + (new Date) + ']'
        },
        error: function (message) {
            if (['error', 'warning', 'info', 'all'].indexOf(this.level) != -1) {
                if (typeof message == 'object') {
                    message = JSON.stringify(message);
                }
                console.error(this.time() + ' ' + this.app + ' => ' + message);
            }
        },
        info: function (message) {
            if (['info', 'all'].indexOf(this.level) != -1) {
                if (typeof message == 'object') {
                    message = JSON.stringify(message);
                }
                console.info(this.time() + ' ' + this.app + ' => ' + message);
            }
        },
        warning: function (message) {
            if (['warning', 'info', 'all'].indexOf(this.level) != -1) {
                if (typeof message == 'object') {
                    message = JSON.stringify(message);
                }
                console.warn(this.time() + ' ' + this.app + ' => ' + message);
            }
        }
    }
    if (!(this instanceof FieldsUtility)) { // Enforce the new
        log.warning('FieldUtility not instantiated with "new". Enforcing "new" now.');
        return new FieldsUtility(node, fields, ajaxFunctions);
    }
    if(!node){
        log.error('No node provided, aborting create.');
        return;
    }
    if(!fields){
        log.error('No field config provided, aborting create.');
        return;
    }
    var CommonDeferred, commonAll;
    function loadDependencies(){
        require(['dojo/Deferred'], function(Deferred){
            CommonDeferred = Deferred;
        });
        var deferred = new CommonDeferred();
        require(['dojo/promise/all'], function(all){
            commonAll = all;

            deferred.resolve();
        })

        return deferred;
    }


    function createDatePicker(widgetId, datePickerNode, onChangeHandler){
        var deferred = new CommonDeferred();
        require(['dijit/form/DateTextBox'], function(DateTextBox){
            var node = document.querySelector('.dateField');
            var dateTextBox = new DateTextBox({
                id: widgetId,
                name: widgetId,
                constraints: { datePattern : 'dd/MM/yyyy' },
                promptMessage: 'dd/MM/yyyyy',
                invalidMessage: 'Invalid date format. Use dd/MM/yyyy',
                'data-id': widgetId
            }, datePickerNode);
            deferred.resolve(dateTextBox);
        });

        return deferred;
    }
    function createSelect(list, widgetId, selectNode, onChangeHandler){
        var deferred = new CommonDeferred();
        if(!list){
            log.error('No list provided, creating empty list for source of select options.');
            list = [];
        }
        require([
            'dojo/store/Memory', 'dijit/form/FilteringSelect'
        ],
            function(Memory, FilteringSelect){
                var stateStore = new Memory({
                    idProperty: 'value',
                    data: list
                });
                var initialValue = '';
                var filteringSelect = new FilteringSelect({
                    id: widgetId,
                    name: widgetId,
                    value: initialValue,
                    store: stateStore,
                    searchAttr: 'name',
                    required: false,
                    'data-id': widgetId
                }, selectNode);
                deferred.resolve(filteringSelect);
            })
        return deferred;
    };

    function addTriggerToSelect(registry, triggeringControl, ajaxFunction, Memory, targetControlWidget) {
        var selectWidget = registry.byNode(triggeringControl);
        selectWidget.on('change', function onChange() {
            log.info('Control ' + selectWidget.id + ' was changed - cascading to ' + targetControlWidget.id);
            var input = selectWidget.get('value');
            // Get the value of selectWidget, call the AJAX function, update the options
            ajaxFunction && ajaxFunction({
                params: {"text": input},
                load: function (outputs) {
                    var list = !!outputs.results && outputs.results.items
                    var stateStore = new Memory({
                        idProperty: 'value',
                        data: list
                    });
                    !!targetControlWidget && targetControlWidget.set('store', stateStore);  // TODO: Check if we need to take care of memory from old store
                },
                error: function (error) {
                    log.error('ERROR: ' + error);
                }
            });
        });

        return selectWidget;
    }
    function addTriggerToInput(){
        //TODO: Complete function if required.
    }
    function createCascadingSelects(results){
        var deferred = new CommonDeferred();
        require(['dojo/on', 'dijit/registry', 'dojo/store/Memory'], function(on, registry, Memory){
//            log.info('All AJAX Selects created, now adding cascading');
//            log.info('Results: ' + JSON.stringify(results));
            for(var i =0; !!results && i < results.length; i++){
                var triggeringControlId = results[i].triggeringControlId;
                var targetControlId = results[i].fieldId;
                var ajaxFunction = results[i].ajaxFunction;

                if(!!triggeringControlId && !!targetControlId){
                    var triggeringControl = document.querySelector('.wrapper.' + triggeringControlId + ' .control > input, .wrapper.' + triggeringControlId + ' .control > div.dijitComboBox');
                    var targetControl = document.querySelector('.wrapper.' + targetControlId + ' .control > div.dijitComboBox');
                    var targetControlWidget = targetControl && registry.byNode(targetControl);

                    if(!triggeringControl){
                        log.warning('WARNING: triggeringControl not found for id: ' + triggeringControlId +'. ' + targetControlId + ' will not be dynamically updated.');
                        continue;
                    }
                    if(!targetControl){
                        log.error('ERROR: targetControl not found for id: ' + targetControlId);
                        continue;
                    }
                    if(!targetControlWidget){
                        log.error('ERROR: targetControlWidget not found for on control with id: ' + targetControlId);
                        continue;
                    }

                    if(triggeringControlId.tagName == 'input'){
                        eventHandlers[eventHandlers.length] = on(triggeringControl, 'change', function onChange(){
                            addTriggerToInput();    //TODO: Complete function if required.
                        });
                    }
                    else{
                        addTriggerToSelect(registry, triggeringControl, ajaxFunction, Memory, targetControlWidget);
                    }
                }
                else{
                    if(!triggeringControlId){
                        log.warning('WARNING No trigger provided for cascading on ' +  targetControlId + ' will not be dynamically updated.')
                    }
                    if(!targetControlId){
                        log.error('No target control provided for cascading select.')
                    }
                }
            }

            deferred.resolve('done');
        });

        return deferred;
    }

    function createAjaxSelect(fieldConfig, ajaxFunctions, selectNode) {
        var deferred = new CommonDeferred();
        var fieldId = fieldConfig.id;
        var triggeringControlId = fieldConfig.triggeringControlId;
        var ajaxFunction = ajaxFunctions[fieldConfig.ajaxFunction];
        var cachedAjaxResults = localStorage.getItem(fieldConfig.ajaxFunction);

        if(!!cachedAjaxResults){    // If cached results exist, use cached results
            log.info('Cached options found for dropdown ' + fieldId +'. Using cached version.');
            var options = JSON.parse(cachedAjaxResults);
            createSelect(options, fieldId, selectNode).then(function resolveAjaxPromise(){
                // Resolve promise here
                deferred.resolve({"fieldId": fieldId, "triggeringControlId": triggeringControlId, "ajaxFunction": ajaxFunction})
            });
        }
        else{
            log.info('No cached options found for dropdown ' + fieldId + '. Waiting for DB version to load.')
        }

        ajaxFunction({
            load: function (outputs) {
                var options = !!outputs.results && outputs.results.items;
                if(!cachedAjaxResults){    // Only create it if wasn't created earlier
                    log.info('DB options found for dropdown ' + fieldId + '. Using DB version. This is now cached.')
                    createSelect(options, fieldId, selectNode).then(function resolveAjaxPromise(){
                        // Resolve promise here
                        deferred.resolve({"fieldId": fieldId, "triggeringControlId": triggeringControlId, "ajaxFunction": ajaxFunction})
                    });
                }

                // Cache results
                localStorage.setItem(fieldConfig.ajaxFunction, JSON.stringify(options));
                if(!!cachedAjaxResults){
                    log.info('DB options found for dropdown ' + fieldId +'. This version is now cached. To load these options into dropdown, refresh the page.');
                }
            },
            error: function (error) {
                log.error(error)
                deferred.reject(error);
            }
        });

        return deferred;
    }
    var promises = [];
    var container = node, fieldDefinitions;
    var multiSelectWidgets = [];
    function build(node, fields, ajaxFunctions){
        fieldDefinitions = fields;
        var eventHandlers = [];


        function buildHTML() {
            // Create the fields first (and create inputs, leave select widgets for a later pass)
            var html = '';
            for (var i = 0; fields && i < fields.length; i++) {
                var containerHTML = '<div class="' + fields[i].type + '_wrapper wrapper ' + fields[i].id + '">';
                containerHTML += '<span class="label">' + fields[i].label + '</span>';
                containerHTML += '<div class="control">';
                if (fields[i].type === 'input') {
                    containerHTML += '<input type="text" data-id="' + fields[i].id + '"/>';
                }
                else if (fields[i].type === 'textarea') {
                    containerHTML += '<textarea data-id="' + fields[i].id + '"></textarea>';
                }
                else if (fields[i].type === 'output') {
                    containerHTML += '<div data-id="' + fields[i].id + '"/>' + (fields[i].value || 'N/A') + '</div>';
                }
                else if (fields[i].type === 'select') {
                    containerHTML += '<div class="selectPlaceHolder"></div>';
                }
                else if (fields[i].type === 'date') {
                    containerHTML += '<div class="datePickerPlaceHolder"></div>';
                }
                else if (fields[i].type === 'multi_select') {
                    containerHTML += '<div class="multiSelect" data-id="' + fields[i].id + '"></div>';
                }
                containerHTML += '</div></div>';
                html += containerHTML;
            }
            // Insert the HTML into the DOM
            node.innerHTML = html;
        }
        function createMultiSelect(options, id, node, label){
            multiSelectWidgets[multiSelectWidgets.length] = new MultiSelect(node, options, {id: id, label: label});

            return;
        }
        function buildMultiSelects(){
            var mutliSelectPromises = [];
            // Pass over again, and create date pickers - reason is we need the node created first before widget can be created
            forEach(fields, function forEachField(field){
                if(field.type === 'multi_select'){
                    var deferred = new CommonDeferred();
                    var multiSelectNode = document.querySelector('.' + field.id + ' > .control > .multiSelect');
                    if(!!field.ajaxFunction){
                        var ajaxFunction = ajaxFunctions[field.ajaxFunction];
                        ajaxFunction && ajaxFunction({
                            load: function (outputs) {
                                var list = !!outputs.results && outputs.results.items
                                mutliSelectPromises[mutliSelectPromises.length] = createMultiSelect(list, field.id, multiSelectNode, field.label);
                                deferred.resolve();
                            },
                            error: function (error) {
                                log.error('ERROR: ' + error);
                                deferred.reject(error);
                            }
                        });
                    }
                    else{
                        mutliSelectPromises[mutliSelectPromises.length] = createMultiSelect(field.options, field.id, multiSelectNode, field.label);
                        deferred.resolve();
                    }
                    mutliSelectPromises[mutliSelectPromises.length] = deferred;
                }
            });

            return commonAll(mutliSelectPromises);
        }
        function buildDatePickers(){
            var datePickerPromises = [];
            // Pass over again, and create date pickers - reason is we need the node created first before widget can be created
            for(var i = 0; !!fields && i < fields.length; i++){
                if(fields[i].type === 'date'){
                    var datePickerNode = document.querySelector('.' + fields[i].id + ' > .control > .datePickerPlaceHolder');
                    datePickerPromises[datePickerPromises.length] = createDatePicker(fields[i].id, datePickerNode);
                }
            }

            return commonAll(datePickerPromises);
        }
        function buildSelects(){
            var ajaxSelectPromises = [];
            var selectPromises = [];
            // Now pass over again, and create selects - reason is we need the node created first before widget can be created
            for(var i = 0; !!fields && i < fields.length; i++){

                if(fields[i].type === 'select'){
                    var selectNode = document.querySelector('.' + fields[i].id + ' > .control > .selectPlaceHolder');

                    // If options to be populated via AJAX
                    if(!!fields[i].ajaxFunction){
                        ajaxSelectPromises[ajaxSelectPromises.length] = createAjaxSelect(fields[i], ajaxFunctions, selectNode);
                    }
                    else{   // Otherwise, create options from list provided
                        selectPromises[selectPromises.length] = createSelect(fields[i].options, fields[i].id, selectNode);
                    }
                }
            }
            selectPromises[selectPromises.length] = commonAll(ajaxSelectPromises).then(createCascadingSelects);

            // On unload
            window.onunload = function(){
                // Dump all the event handlers
                for(var i = 0; !!eventHandlers && i < eventHandlers.length; i++){
                    eventHandlers[eventHandlers.length].remove && eventHandlers[eventHandlers.length].remove();
                }
            };
            // When all promises are met (i.e. all AJAX select fields are created), then add cascading functions
            return commonAll(selectPromises).otherwise(function(error){log.error('ERROR: In selectPromises promise chain.\n' + error)});
        }
        buildHTML();
        promises[promises.length] = buildMultiSelects();
        promises[promises.length] = buildDatePickers();
        promises[promises.length] = buildSelects();

        return commonAll(promises).otherwise(function(error){log.error('ERROR: In build promise chain.\n' + error)});;
    };

    function getModel(){
        if(!container){
            log.warning('getModel: No search parameters have been created.');
            return;
        }
        var model = {};

        // Get the inputs and textarea
        var inputs = container.querySelectorAll('.input_wrapper input, .textarea_wrapper textarea');
        for(var i = 0; !!inputs && i < inputs.length; i++){
            var node = inputs[i];
            if(node.value){
                var fieldName = node.getAttribute('data-id');    // Using getAttribute as IE < 10  doesn't support "node.dataset" which would be quicker
                var fieldValue = node.value;
                model[fieldName] = fieldValue;
            }
        }

        // Get the outputs
        var outputs = container.querySelectorAll('.output_wrapper div.control div');
        for(var i = 0; !!outputs && i < outputs.length; i++){
            var node = outputs[i];
            if(node.innerText){
                var fieldName = node.getAttribute('data-id');    // Using getAttribute as IE < 10  doesn't support "node.dataset" which would be quicker
                var fieldValue = node.innerText;
                model[fieldName] = fieldValue;
            }
        }

        // Get the selects
        var selects = container.querySelectorAll('.select_wrapper .control .dijitInputField > input[type=hidden]');
        for(var i = 0; !!selects && i < selects.length; i++){
            var node = selects[i];
            if(node.value){
                var fieldName = node.name;    // Using DOM attributes rather then dojo widget as we're trying to avoid the async AMD
                var fieldValue = node.value;
                model[fieldName] = fieldValue;
            }
        }

        // Get the dates
        var dates = container.querySelectorAll('.dijitDateTextBox .dijitInputInner');
        for(var i = 0; !!dates && i < dates.length; i++){
            var node = dates[i];
            if(node.value){
                var fieldName = node.getAttribute('data-id');    // Using DOM attributes rather then dojo widget as we're trying to avoid the async AMD
                // Convert date into ISO format
                var dateSplit = node.value.split('/');
                var day = dateSplit[0];
                var month = dateSplit[1];
                var year = dateSplit[2];
                var date = new Date(Date.parse(month + '/' + day + '/' + year));

                // If year is < 1971, we want to cancel out the daylight saving calculations done by Javascript as the server
                // doesn't have daylight saving for Australia < 1970 (as in real life)
                if(Number(year) < 1971){
                    var winterDate = new Date(Date.parse('06/01/' + year)); // Take the hours from a winter month that year.
                    date.setUTCHours(winterDate.getUTCHours());
                }

                var fieldValue = date.toISOString().replace(/\..*Z/g, 'Z');
                model[fieldName] = fieldValue;
            }
        }

        // Get the multi selects
        for(var i = 0; !!multiSelectWidgets && i < multiSelectWidgets.length; i++){
            var fieldValue = String(multiSelectWidgets[i].getFlattenedSelectedModel());
            var fieldName = multiSelectWidgets[i].id;
            if(!!fieldValue && !!fieldName){
                model[fieldName] = fieldValue;
            }
        }

        return model;
    }

    function resetFields(){
        var inputs = container.querySelectorAll('.input_wrapper input[type=text]');
        forEach(inputs, function(input){
            input.value = '';
        });
        var outputs = container.querySelectorAll('.output_wrapper div.control div');
        forEach(outputs, function(output){
            output.innerText = '';
        });
        require(['dijit/registry'], function findWidgets(registry){
            var widgets = registry.findWidgets(container);
            forEach(widgets, function forEachWidgets(widget){
                widget.reset();
            });
        });
        forEach(multiSelectWidgets, function forEachWidget(widget){
            widget.setSelectedModel();
            widget.filterModel('');
            var input = node.querySelector('.filterInput');
            !!input && (input.value = '');
        });
    }
    function setModel(model){
        if(!container){
            log.warning('getModel: No search parameters have been created.');
            return;
        }
        // Clear fields first
        resetFields();

        forEach(model, function(value, property){
            // Check for any select/date widgets with this id
            require(['dijit/registry', 'dojo/ready'], function(registry, ready){
                ready(10000000, function whenWidgetsReady(){   // Make sure selects have all been created first before setting values
                    var widget = registry.byId(property);
                    if(!!widget && widget.baseClass.indexOf('dijitDateTextBox') > 0){   // It's a date field
                        var date = new Date(Date.parse(value, widget.constraints.datePattern))
                        widget.set('value', value);
                    }
                    else{
                        !!widget && widget.set('value', value);
                    }
                })
            });
            // Check for html select or input with this id
            var control =  !!property && container.querySelector('[data-id=' + property + ']');
            if(!!control && control.tagName.toLowerCase() === 'input'){
                control.value = value || ''
            }
            else if(!!control && control.tagName.toLowerCase() === 'div' && control.className.indexOf('multiSelect') == -1){
                control.innerText = value || 'N/A'
            }

            // Check multi select models
            forEach(multiSelectWidgets, function forEachMultiSelects(widget){
                if(widget.id == property){
                    var selectedList = value.split(','); // Split comma separated;
                    widget.setSelectedModel(selectedList);
                }
            });
        });
    }
    function queryModel(query){
        // USAGE:
        // Can query via field definition values
        // e.g. {"id": "requestId"} will pull requestId field back, if it has a value
        // e.g. {"type": "input"} will pull values of all inputs back
        // e.g. {"label": "Request Id"} will pull values of fields with label "Requst Id"
        // One extra one is to query by value
        // e.g. {"value": "blah"} will pull valus of fields with this value

        if(typeof query != 'object'){
            log.error('Query supplied isn\'t a javascript object. Please supply a javascript object.');
            return;
        }
        // If "value" is passed into query, go through model to find any matching
        var modelSubset = {};
        if(!!query.value){
            var model = getModel();
            forEach(model, function forEachModelItem(modelValue, modelProperty){
                if(modelValue == query.value){
                    modelSubset[modelProperty] = modelValue;
                }
            });
        }
        else{
            modelSubset = getModel();
        }

        // Go through query to build subset of field definition first
        var fieldDefinitionsSubset = [];
        forEach(query, function forEachQueryItem(queryValue, queryName){
            forEach(fieldDefinitions, function forEachFieldDefinition(fieldDefinition){
                if(!!fieldDefinition[queryName] && fieldDefinition[queryName] == queryValue){
                    fieldDefinitionsSubset.push(fieldDefinition);
                }
            });
        });

        // Go through the modelSubset with the fieldDefinitionsSubset
        var queryResults = {};
        forEach(modelSubset, function forEachModelSubset(modelSubsetValue, modelSubsetName){
            forEach(fieldDefinitionsSubset, function forEachFieldDefinition(fieldDefinition){
                if(!!fieldDefinition['id'] && !!modelSubset[fieldDefinition['id']]){    // Find value in model using the id
                    queryResults[fieldDefinition['id']] = modelSubset[fieldDefinition['id']];
                }
            });
            if(fieldDefinitionsSubset.length == 0){ // then the queryResults is just he modelSubset
                queryResults = modelSubset;
            }
        });

        return queryResults;
    }

    function getMultiSelectWidgets(){
        return multiSelectWidgets;
    }

    // We have defined all the utilities we need.
    // Now create the fields.


    this.buildComplete = loadDependencies().then(function(){
        function returnSuccess(){
            return 'success';
        }
        return build(node, fields, ajaxFunctions).then(returnSuccess).otherwise(function(error){log.error('ERROR: Error in buildComplete promise chain.\n' + error)});
    });

    // Now fields are created, let's expose the stuff we want to expose.
    this.reset = resetFields;
    this.container = container;
    this.setLogLevel = setLogLevel;
    this.promises = promises; // Store the promises from the AJAX Select creation so whatever is calling this function knows when they are ready
    this.getModel = getModel;
    this.setModel = setModel;
    this.queryModel = queryModel;
    this.getMultiSelectWidgets = getMultiSelectWidgets;
};