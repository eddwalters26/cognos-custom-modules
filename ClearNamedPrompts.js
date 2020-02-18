define(function () {
	"use strict";

	function ClearNamedPrompts() {
	};
	
	ClearNamedPrompts.prototype.initialize = function( oControlHost, fnDoneInitializing )
	{
		this.m_oControlHost = oControlHost;
		this.m_oConfiguration = this.m_oControlHost.configuration || {};
		fnDoneInitializing();
	};

	ClearNamedPrompts.prototype.draw = function (oControlHost) {
		var v_PromptName = this.m_oConfiguration["PromptName"] ? this.m_oConfiguration["PromptName"] : 'AllPromptsPlease';
		var aControls = oControlHost.page.getAllPromptControls();

		for ( var i = 0; i < aControls.length; i++ ) {
			var oControl = aControls[i];	
			var v_CurrentPromptName = oControl.name.toString();
					
			if( v_CurrentPromptName.indexOf( v_PromptName ) != -1 || v_PromptName == 'AllPromptsPlease' )
			{
				oControl.clearValues();
			}
		}
	};
	
	return ClearNamedPrompts;
});