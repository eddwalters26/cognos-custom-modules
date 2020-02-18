define( ["./DataStoreUtility.js"], function(DataStoreUtility) {
    "use strict";
    
    function FilterButtons()
    {
    };
    
    FilterButtons.prototype.initialize = function(oControlHost, fnDoneInitializing) {
        this.o_ControlHost = oControlHost;
        this.filterColumnName = oControlHost.configuration['filterColumn'];
        this.cascadeColumn = oControlHost.configuration['cascadeColumn'];
        this.cascadeControls = oControlHost.configuration['cascadeControls'] || [];
        this.filterControls = oControlHost.configuration['filterControls'] || [];
        this.defaultText = oControlHost.configuration['defaultText'] || 'Select All';
        this.controlLabel = oControlHost.configuration['labelText'] || this.filterColumnName;
        this.storageName = 'financeFilters';
        this.oContainer = oControlHost.container;
        this.controlId = oControlHost.generateUniqueID();
        //Generate promises to cascade controls
        this.cascadePromises = [];
        this.cascadeControls.forEach(function(c) {
            if(oControlHost.page.getControlByName(c)) {
                this.cascadePromises.push(oControlHost.page.getControlByName(c).instance);
            }
        }, this);
        this.hasCascadeControls = Array.isArray(this.cascadePromises) && this.cascadePromises.length ? true : false;
        //Generate promises to filter controls
        this.filterPromises = [];
        this.filterControls.forEach(function(c) {
            if(oControlHost.page.getControlByName(c)) {
                this.filterPromises.push(oControlHost.page.getControlByName(c).instance);
            }
        }, this);
        this.hasFilterControls = Array.isArray(this.filterPromises) && this.filterControls.length ? true : false;
        
        DataStoreUtility.setLocalStorage(this.storageName, []);
        fnDoneInitializing();
    };
    
    FilterButtons.prototype.draw = function(oControlHost) {
        this.drawFilterControl(this.j_Datastore);
    };
    
    FilterButtons.prototype.drawFilterControl = function(oDataStore) {
        this.oContainer.innerHTML = '';
        this.drawSingleSelect(this.o_ControlHost, oDataStore, this.filterColumnIndex);
    };
    
    FilterButtons.prototype.drawSingleSelect = function(oControlHost, oDataStore, columnIndex) {
        let uniqueColumnValues = DataStoreUtility.uniqueColumnValues(oDataStore, columnIndex);
        let label = document.createElement('LABEL');
        label.textContent = this.filterColumnName;
        label.htmlFor = this.controlId;
        oControlHost.container.appendChild(label);
    
        let singleSelect = document.createElement('SELECT');
        singleSelect.id = this.controlId;
    
        let option = document.createElement('OPTION');
        option.text = this.defaultText;
        singleSelect.add(option);
        
        uniqueColumnValues.forEach(function(val) {
            option = document.createElement('OPTION');
            option.value = oDataStore.columns[columnIndex].values[val];
            option.text = oDataStore.columns[columnIndex].values[val];
            singleSelect.add(option);
        });
    
        singleSelect.addEventListener('change', function(e){
            this.clickFilterSingleSelect('foreignFilterCall', this.filterColumnName, e.target.value, e.target.selectedIndex);
         }.bind(this));
        oControlHost.container.appendChild(singleSelect);
    
        let clearButton = document.createElement('BUTTON');
        clearButton.type = 'button'
        clearButton.textContent = 'Clear';
        clearButton.addEventListener('click', function(e){
            singleSelect.selectedIndex = 0;
            this.clickFilterSingleSelect('foreignFilterCall', this.filterColumnName, 0, 0);
        }.bind(this));
        oControlHost.container.appendChild(clearButton);
    };
    
    FilterButtons.prototype.checkFilterState = function(aFilters, columnName, columnValue) {
        let filterIndex = -1;
        let filterPressed = -1;
    
        aFilters.some(function(filter, index) {
            if(filter.filterName === columnName) {
                filterIndex = index;
                filterPressed = filter.filterValues.indexOf(columnValue);
                return true;
            }
        });
    
        return {
            filterIndex: filterIndex,
            filterPressedIndex: filterPressed
        };
    };
    
    FilterButtons.prototype.clickFilterSingleSelect = function(event, columnName, columnValue, selectedIndex) {
        let filterState = DataStoreUtility.getLocalStorage(this.storageName);
        let filterStatus = this.checkFilterState(filterState, columnName, columnValue);
        let parentSelectAll = false;
        if(selectedIndex === 0) {
            filterStatus.filterIndex !== -1 && filterState.splice(filterStatus.filterIndex, 1);
            parentSelectAll = true;
        }
        else if(filterStatus.filterIndex === -1) {
            filterState.push({
                filterName: columnName,
                filterValues: [columnValue]
            });
        }
        else if(filterStatus.filterPressedIndex === -1)
        {
            filterState[filterStatus.filterIndex].filterValues[0] = columnValue;
        }
        else {
            filterState[filterStatus.filterIndex].filterValues.splice(filterStatus.filterPressedIndex, 1);
            filterState[filterStatus.filterIndex].filterValues.length === 0 && filterState.splice(filterStatus.filterIndex, 1);
        }
        //Save filters in local storage
        DataStoreUtility.setLocalStorage(this.storageName, filterState);
        //Trigger foreign event through promises
        if(this.hasCascadeControls) {
            this.triggerForeignEvent(this.cascadePromises, event, parentSelectAll);
        }
        if(this.hasFilterControls) {
            this.triggerForeignEvent(this.filterPromises, event, this.storageName);
        }
    };
    
    FilterButtons.prototype.foreignFilterCall = function(parentSelectAll) {
        //Clear any current filter selections because control will be redrawn
        let filterState = DataStoreUtility.getLocalStorage(this.storageName);
        let filterStatus = this.checkFilterState(filterState, this.filterColumnName, -1);
        filterStatus.filterIndex !== -1 && filterState.splice(filterStatus.filterIndex, 1);
        DataStoreUtility.setLocalStorage(this.storageName, filterState);
        
        if(Array.isArray(filterState) && filterState.length===0 && parentSelectAll) {
            this.drawFilterControl(this.j_Datastore);
        }
        else {
            let filteredDataStore = DataStoreUtility.filterDatasetByAllStorage(this.j_Datastore, this.storageName);
            this.drawFilterControl(filteredDataStore);
        }
    };
    
    FilterButtons.prototype.triggerForeignEvent = function() {
        const args = Array.prototype.slice.call(arguments);
        const promises = args.shift();
        const event = args.shift();
    
        Q.all(promises).done(
            function(aModuleInstance) {
                for(let x=0; x<aModuleInstance.length; x++) {
                    if(aModuleInstance[x][event]) {
                        let argsToSend = args.slice(0, aModuleInstance[x][event].length);
                        aModuleInstance[x][event].apply(aModuleInstance[x], argsToSend);
                    }
                }
            });
    };
    
    FilterButtons.prototype.getParameters = function(oControlHost) {
    };
    
    FilterButtons.prototype.setData = function(oControlHost, oDataStore) {
        this.oDataStore = oDataStore;
        this.filterColumnIndex = oDataStore.getColumnIndex(this.filterColumnName);
        this.j_Datastore = DataStoreUtility.generateDataStore(oDataStore);
    };
    
    return FilterButtons;
});