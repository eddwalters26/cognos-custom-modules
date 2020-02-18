define( function() {
"use strict";

var DataStoreUtility = {};

DataStoreUtility.generateDataStore = function(oDataStore) {
    let aColumns = [];
    let aRows = [];
    
    for(let iCol = 0; iCol < oDataStore.columnCount; iCol++) {
        aColumns[iCol] = {
            name : oDataStore.columnNames[iCol],
            dataType : oDataStore.dataTypes[iCol],
            values : oDataStore.columnFormattedValues[iCol] || oDataStore.columnValues[iCol],
        };
    }
    
    for(let iRow = 0; iRow < oDataStore.rowCount; iRow++) {
        let aRow = [];
        for(var iCol = 0; iCol < oDataStore.columnCount; iCol++) {
            (oDataStore.dataTypes[iCol] === 'number') ? aRow.push(oDataStore.getCellValue(iRow, iCol)) : aRow.push(oDataStore.getCell(iRow, iCol).valueIndex);
        }
        aRows.push(aRow);
    }

    return {
        columns : aColumns,
        rows : aRows
    };
}

DataStoreUtility.sortBySingleColumn = function(oDataStore, iColumnIndex) {
    let rowsToSort = oDataStore.rows;
                   
    rowsToSort.sort(function(a, b) {
        if(oDataStore.columns[iColumnIndex][a] < oDataStore.columns[iColumnIndex][b]) return -1;
        if(oDataStore.columns[iColumnIndex][a] > oDataStore.columns[iColumnIndex][b]) return 1;
        return 0;
    })
        
    return {
        columns: oDataStore.columns,
        rows: rowsToSort
    }
}

DataStoreUtility.uniqueColumnValues = function(oJson, iColumnIndex) {
	var oValueIndexes = [];
    
    oJson.rows.forEach(function(aRow) {
        if(oValueIndexes.indexOf(aRow[iColumnIndex]) === -1) {
            oValueIndexes.push(aRow[iColumnIndex]);
        }
    });
    
    return oValueIndexes;
};

DataStoreUtility.sortByMultiColumn = function(oDataStore, aColumnIndexes) {
    let rowsToSort = oDataStore.rows;
    let colValuesToSort = [];
    
    if(Array.isArray(aColumnIndexes)) {
        aColumnIndexes.forEach(function(c, index) {
            colValuesToSort[index] = oDataStore.columns[c].values;
        });
    }
    else {
        colValuesToSort[0] = oDataStore.columns[aColumnIndexes].values;
    }
    
    let colLength = aColumnIndexes.length || 0;
            
    rowsToSort.sort(function(a, b) {
        for(let x=0; x < colLength; x++) {
           let c = aColumnIndexes[x];
           if (colValuesToSort[x][a[c]] < colValuesToSort[x][b[c]]) return -1;
           if (colValuesToSort[x][a[c]] > colValuesToSort[x][b[c]]) return 1;
        }
        return 0;
    })
        
    return {
        columns: oDataStore.columns,
        rows: rowsToSort
    }
}

DataStoreUtility.filterSingleColumnSingleValue = function(oJson, iColumnIndex, iValueIndex) {
	return {
		columns : oJson.columns,
		rows : oJson.rows.filter(function(aRow) {return aRow[iColumnIndex] === iValueIndex})
	};
};

DataStoreUtility.filterSingleColumnMultiValue = function(oJson, iColumnIndex, oValueIndexes) {
	return {
		columns : oJson.columns,
		rows : oJson.rows.filter(function(aRow) {
            return oValueIndexes.indexOf(aRow[iColumnIndex]) !== -1;
        })
	};
};

DataStoreUtility.filterByMultiColumnMultiValue = function(oJson, oFilters) {
    let filteredRows = oDataStore.rows.filter(function(row) {
        let test = [];
        oFilters.forEach(function(filter) {
            filter.columnValueIndex.indexOf(row[filter.columnIndex]) === -1 ? test.push(false) : test.push(true);
        });
        return test.every(function(t) {return t === true});
    });

    return {
        columns : oJson.columns,
        rows : filteredRows
    };
};

DataStoreUtility.repointFilterIndexes = function(oJsonFrom, oJsonTo, oFilters) {
    
};

DataStoreUtility.getColumnIndex = function(oJson, columnName) {
    let index = -1
    oJson.columns.some(function(col, i){
        if(col.name === columnName) {
            index = i;
            return true;
        } 
    });
    return index;
};

DataStoreUtility.filterDatasetByColumnNameStorage = function(oJson, storageName, columnName) {
    let activeFilters = this.getLocalStorage(storageName);
    let convertedFilters = [];
    activeFilters.forEach(function(filter) {
        if(filter.filterName === columnName) {
            let columnIndex = this.getColumnIndex(oJson, filter.filterName);
            if(columnIndex !== -1) {
                let columnValueIndexes = [];
                filter.filterValues.forEach(function(val){
                    let columnValueIndex = this.getColumnValueIndex(oJson, columnIndex, val);
                    columnValueIndex !== -1 && columnValueIndexes.push(columnValueIndex);
                }, this);
                convertedFilters.push({
                    columnIndex: columnIndex,
                    columnValueIndexes: columnValueIndexes
                });
            }
        }
    }, this);
    
    if(Array.isArray(convertedFilters) && convertedFilters.length) {
        let filteredRows = oJson.rows.filter(function(row) {
            let test = [];
            convertedFilters.forEach(function(filter) {
                filter.columnValueIndexes.indexOf(row[filter.columnIndex]) === -1 ? test.push(false) : test.push(true);
            }, this);
            return test.every(function(t) {return t === true});
        }, this);
    
        return {
            columns : oJson.columns,
            rows : filteredRows
        };
    }
    return oJson;
};


DataStoreUtility.filterDatasetByAllStorage = function(oJson, storageName) {
    let activeFilters = this.getLocalStorage(storageName);
    let convertedFilters = [];
    activeFilters.forEach(function(filter) {
        let columnIndex = this.getColumnIndex(oJson, filter.filterName);
        if(columnIndex !== -1) {
            let columnValueIndexes = [];
            filter.filterValues.forEach(function(val){
                let columnValueIndex = this.getColumnValueIndex(oJson, columnIndex, val);
                columnValueIndex !== -1 && columnValueIndexes.push(columnValueIndex);
            }, this);
            convertedFilters.push({
                columnIndex: columnIndex,
                columnValueIndexes: columnValueIndexes
            });
        }
    }, this);
    
    if(Array.isArray(convertedFilters) && convertedFilters.length) {
        let filteredRows = oJson.rows.filter(function(row) {
            let test = [];
            convertedFilters.forEach(function(filter) {
                filter.columnValueIndexes.indexOf(row[filter.columnIndex]) === -1 ? test.push(false) : test.push(true);
            }, this);
            return test.every(function(t) {return t === true});
        }, this);
    
        return {
            columns : oJson.columns,
            rows : filteredRows
        };
    }
    return oJson;
}

DataStoreUtility.setLocalStorage =  function(storageName, storageData) {
    localStorage.setItem(storageName, JSON.stringify(storageData));
};

DataStoreUtility.getLocalStorage = function(storageName) {
    return JSON.parse(localStorage.getItem(storageName));
};

DataStoreUtility.getColumnValueIndex = function(oJson, columnIndex, columnValue) {
    return oJson.columns[columnIndex].values.indexOf(columnValue);
};

return DataStoreUtility;
});
