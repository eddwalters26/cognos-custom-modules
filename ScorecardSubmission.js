define( function() {
    "use strict";
    
    function ScorecardSubmission() {
    };
    
    ScorecardSubmission.prototype.initialize = function(oControlHost, fnDoneInitializing) {
        this.oControlHost = oControlHost;
        this.oContainer = oControlHost.container;
        this.oPage = oControlHost.page;
        this.returnParameters = [];
        fnDoneInitializing();
    };
     
    ScorecardSubmission.prototype.draw = function(oControlHost) {
        //Create and draw the submit button
        let submitButton = document.createElement('BUTTON');
        submitButton.type = 'button';
        submitButton.classList.add('bp');
        submitButton.textContent = 'Submit'
        submitButton.addEventListener('click', this.getInputValues.bind(this));
        this.oContainer.appendChild(submitButton);

        //Clear metricInput prompt values
        let metricInputs = this.oPage.getControlsByName('metricInput');
        for(let x=0; x < metricInputs.length; x++) {
            metricInputs[x].clearValues();
        }
    };

    ScorecardSubmission.prototype.getInputValues = function() {
        let metricDetails = document.querySelectorAll('.metricSubmission');
        let metricInputs = this.oPage.getControlsByName('metricInput');
        let valueHasChanged = false;
        for(let x=0; x < metricDetails.length; x++) {
            let entertedValue = metricInputs[x].getValues();
            if(entertedValue[0].use) {
                let promptValueName = 'metricValue_' + metricDetails[x].dataset.metricGroupId + '_' + metricDetails[x].dataset.metricId;
                let promptTypeName = 'metricType_' + metricDetails[x].dataset.metricGroupId + '_' + metricDetails[x].dataset.metricId;
                let promptTypeValue = [{
                    use: metricDetails[x].dataset.metricType,
                    display: metricDetails[x].dataset.metricType
                }];
                let currentValueParameter = {
                    parameter: promptValueName,
                    values: entertedValue
                };
                this.returnParameters.push(currentValueParameter);

                let currentTypeParameter = {
                    parameter: promptTypeName,
                    values: promptTypeValue
                };
                this.returnParameters.push(currentTypeParameter);

                valueHasChanged = true;
            }
        }
        if(valueHasChanged) {
            this.oControlHost.valueChanged();
            this.oControlHost.reprompt();
        }
    };
    
    ScorecardSubmission.prototype.getParameters = function(oControlHost) {
        return this.returnParameters;
    };
    
    return ScorecardSubmission;
});