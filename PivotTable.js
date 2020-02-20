define( ["./DataStoreUtility.js"], function(DataStoreUtility) {
"use strict";

function PivotTable() {
};

PivotTable.prototype.initialize = function(oControlHost, fnDoneInitializing) {
    this.oContainer = oControlHost.container;
    this.oConfiguration = oControlHost.configuration
    this.pivotTableId = oControlHost.generateUniqueID();
    fnDoneInitializing();
};

PivotTable.prototype.destroy = function(oControlHost) {
};

PivotTable.prototype.draw = function(oControlHost) {
    this.oContainer.classList.add('font-container');
    //this.oContainer.appendChild(this.drawTable(this.j_Datastore));
    this.oContainer.appendChild(this.drawPivotTable(this.j_Datastore, this.pivotColumnIndex, this.pivotRowIndex, this.pivotValuesIndex, true));
 };

PivotTable.prototype.drawPivotTable = function(oDataStore, iColumnIndex, iRowIndex, iValueIndex, sortValues) {
    let pivotTable = document.createElement('TABLE');
    pivotTable.className = 'pivotTable';
    pivotTable.id = this.pivotTableId;
    let pivotHeader = document.createElement('THEAD');
    let pivotHeaderRow = pivotHeader.insertRow();
    pivotHeaderRow.appendChild(document.createElement('TH'));
    
    let columnValueIndexes = DataStoreUtility.uniqueColumnValues(oDataStore, iColumnIndex);
    let rowValueIndexes = DataStoreUtility.uniqueColumnValues(oDataStore, iRowIndex);
    let aValues = [];
    let pivotData = [];
    oDataStore.rows.forEach(function(row){
        pivotData.push({
            column: row[iColumnIndex],
            row: row[iRowIndex],
            value: row[iValueIndex]
        })
    });
    
    rowValueIndexes.forEach(function() {
        aValues.push([]);
    });
    
    if(sortValues) {
        columnValueIndexes.sort(function(a,b) {
            let aValue = oDataStore.columns[iColumnIndex].values[a];
            let bValue = oDataStore.columns[iColumnIndex].values[b];
            if(aValue < bValue) return -1
            if(aValue > bValue) return 1
            return 0
        });
        
        rowValueIndexes.sort(function(a,b) {
            let aValue = oDataStore.columns[iRowIndex].values[a];
            let bValue = oDataStore.columns[iRowIndex].values[b];
            if(aValue < bValue) return -1
            if(aValue > bValue) return 1
            return 0
        });
    }
    
    //Table Header Column Values
    columnValueIndexes.forEach(function(currentValue, currentIndex) {
        let pivotHeaderCell = document.createElement('TH');
        pivotHeaderCell.textContent = oDataStore.columns[iColumnIndex].values[currentValue];
        pivotHeaderRow.appendChild(pivotHeaderCell);
        aValues.forEach(function(aRow){
            aRow.push(0);
        })
    });;
    pivotTable.appendChild(pivotHeader);
    
    let pivotBody = document.createElement('TBODY');
    
    //Table Row Values
    oDataStore.rows.forEach(function(aRow) {
        let y = rowValueIndexes.indexOf(aRow[iRowIndex]);
        let x = columnValueIndexes.indexOf(aRow[iColumnIndex]);
        aValues[y][x] += aRow[iValueIndex] 
    });
        
    for(let y=0; y < rowValueIndexes.length; y++) {
        let pivotRow = pivotBody.insertRow();
        let rowHeaderValue = rowValueIndexes[y];
        pivotRow.insertCell().textContent = oDataStore.columns[iRowIndex].values[rowHeaderValue];
        for(let x=0; x < aValues[y].length; x++) {
            pivotRow.insertCell().textContent = aValues[y][x];
        }
    }
    
    pivotTable.appendChild(pivotBody);    
    return pivotTable;
};


PivotTable.prototype.getParameters = function(oControlHost) {
};


PivotTable.prototype.setData = function(oControlHost, oDataStore) {
   this.oDataStore = oDataStore;
   this.pivotTableStructure = this.oConfiguration['pivotTable'];
   this.pivotRowIndex = oDataStore.getColumnIndex(this.pivotTableStructure.rows);
   this.pivotColumnIndex = oDataStore.getColumnIndex(this.pivotTableStructure.columns);
   this.pivotValuesIndex = oDataStore.getColumnIndex(this.pivotTableStructure.values);
   this.j_Datastore = DataStoreUtility.generateDataStore(oDataStore);
};

PivotTable.prototype.foreignFilterCall = function(storageName) {
    let filteredDataStore = DataStoreUtility.filterDatasetByAllStorage(this.j_Datastore, storageName);
    this.oContainer.innerHTML = '';
    this.oContainer.appendChild(this.drawPivotTable(filteredDataStore, this.pivotColumnIndex, this.pivotRowIndex, this.pivotValuesIndex, true));
};

PivotTable.prototype.filterTable = function(oDataStore, columnIndex, columnValueIndex) {
    let filteredDataStore = DataStoreUtility.filterSingleColumnSingleValue(oDataStore, columnIndex, columnValueIndex);
    this.oContainer.innerHTML = '';
    this.oContainer.appendChild(this.drawPivotTable(filteredDataStore, this.pivotColumnIndex, this.pivotRowIndex, this.pivotValuesIndex, true));
};

return PivotTable;
});
