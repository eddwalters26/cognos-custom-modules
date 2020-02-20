define( function() {
"use strict";

function CSSImport() {
};

CSSImport.prototype.draw = function(oControlHost) {
	let cssFileId = oControlHost.configuration['cssFileId'];
	let cssFileUrl = oControlHost.configuration['cssFileUrl'];
    
    for(let x=0; x<cssFileId.length; x++) {
        //Create link to cssFile
        if(!document.getElementById(cssFileId[x])) {
            let cssFile = document.createElement('link');
            cssFile.rel = 'stylesheet';
            cssFile.type = 'text/css';
            cssFile.id = cssFileId[x];
            cssFile.href = cssFileUrl[x];
            document.getElementsByTagName('head')[0].appendChild(cssFile);
        }
    }
};

return CSSImport;
});
