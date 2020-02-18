define( function() {
    "use strict";
    
    function GenerateParameters() {
    };
    
    GenerateParameters.prototype.initialize = function(oControlHost, fnDoneInitializing) {
        this.returnParameters = [];
        fnDoneInitializing();
    };
  
    GenerateParameters.prototype.draw = function(oControlHost) {
        oControlHost.valueChanged();
    };
 
    GenerateParameters.prototype.isInValidState = function(oControlHost) {
        return true;
    };
    
    GenerateParameters.prototype.getParameters = function(oControlHost) {
        return this.returnParameters;
    };
    
    GenerateParameters.prototype.setData = function(oControlHost, oDataStore) {
        const promptDefaults = [{
            use: "-999",
            display: "-999"
        }];

        for(let x=0; x < oDataStore.columnValues[0].length; x++){
            let metricGroup = oDataStore.columnValues[0][x];
            this.returnParameters.push(
                {
                    parameter: 'metricValue_' + metricGroup + '_' + '0',
                    values: promptDefaults
                }
            );

            this.returnParameters.push(
                {
                    parameter: 'metricType_' + metricGroup + '_' + '0',
                    values: promptDefaults
                }
            );
        }

        for(let x=0; x < oDataStore.rowCount; x++) {
            let metricGroup = oDataStore.getCellValue(x, 0);
            let metricGroupId = oDataStore.getCellValue(x, 1);

            this.returnParameters.push(
                {
                    parameter: 'metricValue_' + metricGroup + '_' + metricGroupId,
                    values: promptDefaults
                }
            );

            this.returnParameters.push(
                {
                    parameter: 'metricType_' + metricGroup + '_' + metricGroupId,
                    values: promptDefaults
                }
            );
        }
    };
    
    return GenerateParameters;
});