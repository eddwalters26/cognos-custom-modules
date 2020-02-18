define(function() {
'use strict';

function FilteredDataset() {
};

FilteredDataset.prototype.initialize = function(oControlHost, fnDoneInitializing) {
    //Initialise vars
    this.m_oControlHost = oControlHost;
    this.pivotTableId = oControlHost.generateUniqueID();
    this.m_oConfiguration = this.m_oControlHost.configuration || {};
    this.o_Container = oControlHost.container;
    this.filterStorageName = this.m_oControlHost.control.name + 'Filters';
    this.listStorageName = this.m_oControlHost.control.name + 'List';
    this.tabStorageName = this.m_oControlHost.control.name + 'Tab';
    //Find out which filter buttons were pressed on refresh
    var filterStatus = getLocalStorage(this.filterStorageName);
    filterStatus ? this.j_FilterButtonsPressed = filterStatus : this.j_FilterButtonsPressed = [];
    //Find out if the patient list was open on refresh
    var listStatus = getLocalStorage(this.listStorageName);
    listStatus ? this.j_ShowDetailList = listStatus : this.j_ShowDetailList = {};
    //Find out which tab was open on refresh
    var tabStatus = getLocalStorage(this.tabStorageName);
    tabStatus ? this.j_tabOpen = Number(tabStatus) : this.j_tabOpen = 0;
    //Tell Cognos we are done initialising    
    fnDoneInitializing();
};

function setLocalStorage(storageName, storageData) {
    localStorage.setItem(storageName, JSON.stringify(storageData));
};

function getLocalStorage(storageName) {
    return JSON.parse(localStorage.getItem(storageName));
};

FilteredDataset.prototype.draw = function(oControlHost) {
    //Create link to filteredDataset.css
    if(!document.getElementById('filteredDataset')) {
        var cssFile = document.createElement('link');
        cssFile.rel = 'stylesheet';
        cssFile.type = 'text/css';
        cssFile.id='filteredDataset';
        cssFile.href = '../samples/js/Edd/FilteredDataset/filteredDataset.css?version=3.68';
        document.getElementsByTagName('head')[0].appendChild(cssFile);
    }
    //Create link to font
    if(!document.getElementById('googleFonts')) {
        var cssFile = document.createElement('link');
        cssFile.rel = 'stylesheet';
        cssFile.type = 'text/css';
        cssFile.id='googleFonts';
        cssFile.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
        document.getElementsByTagName('head')[0].appendChild(cssFile);
    }
    //Start drawing the container
    this.o_Container.classList.add('font-container');
    var wholeTable = document.createElement('TABLE');
    var wholeTableRow = wholeTable.insertRow();
    var wholeTableColumnOne = wholeTableRow.insertCell();
    var wholeTableColumnTwo = wholeTableRow.insertCell();
    wholeTable.classList.add('container');
    this.o_Container.appendChild(wholeTable);
    
    //Draw filter buttons by looping through button structure
    var filterTable = document.createElement('TABLE');
    this.filterButtons.forEach(function(button, index) {
        //Draw a button for each value in the column
        this.drawFilterButtons(button, index, filterTable);
    }, this);
    
    //Create the clear filter button
    var filterTableRow = filterTable.insertRow();
    var filterTableColumn = filterTableRow.insertCell();
    var clearFilterButton = document.createElement('BUTTON');
    clearFilterButton.type = 'button';
    clearFilterButton.classList.add('clearFilterButton');
    //clearFilterButton.addEventListener('click', function() {this.clearFiltersButtonClick()}.bind(this));
    clearFilterButton.addEventListener('click', this.clearFiltersButtonClick.bind(this));
    clearFilterButton.innerHTML = '<img style="width:100%;height:100%;" src="../samples/js/Edd/FilteredDataset/clearFilter.png">';
    filterTableColumn.colSpan=2;
    filterTableColumn.appendChild(clearFilterButton);

    wholeTableColumnOne.appendChild(filterTable);
    
    //Draw the data column draw tabs if required if a button is pressed draw a filtered dataset
    if(this.groupTabShow) {
        wholeTableColumnTwo.appendChild(this.drawGroupTabs(this.j_Datastore.columns[this.groupTabIndex].values));
        if(this.j_FilterButtonsPressed.length === 0) {
            this.groupTabCollection.forEach(function(tab, index) {
                tab.appendChild(this.drawTable(this.j_groupTabData[index], index));
            }, this);   
        }
        else {
            this.groupTabCollection.forEach(function(tab, index) {
                tab.appendChild(this.drawTable(this.filterDataset(this.j_groupTabData[index]), index));
            }, this);
        }
         //Set last viewed tab to visible
        this.groupTabToggle(this.j_tabOpen);
    }
    else {
        if(this.j_FilterButtonsPressed.length === 0) {
            wholeTableColumnTwo.appendChild(this.drawTable(this.j_Datastore, -1));
        }
        else {
            wholeTableColumnTwo.appendChild(this.drawTable(this.filterDataset(this.j_Datastore), -1));
        }
    }
    //Draw the modal container
    this.modalContainer = this.drawPatientModal();
    this.o_Container.appendChild(this.modalContainer);
    //Open the patient list if it was open on refresh
    if (Object.keys(this.j_ShowDetailList).length !== 0) {
        this.togglePatientModal(this.filterDataset(this.j_Datastore), this.j_ShowDetailList.colIndex, this.j_ShowDetailList.colValueIndex);
    }
    //"Press: buttons that are active
    this.setFilterButtonState();
};

FilteredDataset.prototype.setFilterButtonState = function() {
    //Loop through the filter button structure
    for(let i=0; i < this.j_FilterButtonsPressed.length; i++) {
        for(let x=0; x < this.j_FilterButtonsPressed[i].columnValueIndex.length; x++) {
            //Select the buttons based on column index and value index and toggle the active class
            var button = this.o_Container.querySelector('button[data-column-index="' + this.j_FilterButtonsPressed[i].columnIndex + '"][data-column-value-index="' + this.j_FilterButtonsPressed[i].columnValueIndex[x] +'"]');
            button && button.classList.toggle('active');
        }
    }
};

FilteredDataset.prototype.drawPatientModal = function() {
    //Draw the patient modal header and body which contains the data list
    var modalContainer = document.createElement('DIV');
    modalContainer.id = this.m_oControlHost.control.name + '_modalBox';
    modalContainer.classList.add('modal');
    modalContainer.style.display = 'none';
    //Set an event on the container to listen for clicks if the target is the modalContainer then toggle it
    //this will close it on click as it will be open if it can be clicked
    this.o_Container.addEventListener('click', function(e) {e.target === modalContainer ? this.togglePatientModal() : false}.bind(this));
    this.modalContent = document.createElement('DIV');
    this.modalContent.id = this.m_oControlHost.control.name + '_modalContent';
    this.modalContent.classList.add('modal-content');
    this.modalHeader = document.createElement('DIV');
    this.modalHeader.classList.add('modal-header');
    this.modalHeader.id = this.m_oControlHost.control.name + '_modalHeader';
    this.modalBody = document.createElement('DIV');
    this.modalBody.classList.add('modal-body');
    this.modalBody.id = this.m_oControlHost.control.name + '_modalBody';
    this.modalContent.appendChild(this.modalHeader);
    this.modalContent.appendChild(this.modalBody);
    modalContainer.appendChild(this.modalContent);
    return modalContainer;
};

FilteredDataset.prototype.togglePatientModal = function(oDataStore, colIndex, colValueIndex) {
    //If block is showing set display to none and empty the local storage
    if (this.modalContainer.style.display === 'block') {
        this.modalContainer.style.display = 'none';
        setLocalStorage(this.listStorageName, {});
        return;
    }
    //Show the block and store the current view in the local storage
    setLocalStorage(this.listStorageName, {colIndex: colIndex, colValueIndex: colValueIndex});
    this.drawPatientList(oDataStore, colIndex, colValueIndex);
    this.modalContainer.style.display = 'block';
    return;
};

FilteredDataset.prototype.drawFilterButtons = function(button, buttonIndex, filterTable) {
    var sColumnValues = this.j_Datastore.columns[button.valueIndex].values;
    var sColumnSortValues = this.j_Datastore.columns[button.sortIndex].values;
    var filterTableRow = filterTable.insertRow();
    var filterLabel = filterTableRow.insertCell();
    filterLabel.classList.add('filterLabel');
    filterLabel.textContent = button.caption;
    //Create an array of buttons for the column values this is so it can be sorted
    var aFilterButtons = [];
    for(let x=0; x < sColumnValues.length; x++) {
        var filterButton = document.createElement('BUTTON');
        filterButton.type = 'button';
        filterButton.textContent = sColumnValues[x];
        filterButton.dataset.columnIndex = button.valueIndex;
        filterButton.dataset.columnValueIndex = x;
        filterButton.dataset.buttonSort = sColumnSortValues[x];
        filterButton.addEventListener('click', function(e) {this.filterButtonClick(e.target);}.bind(this));
        filterButton.className = 'filterButton';
        aFilterButtons.push(filterButton);
    }
    //Sort buttons based on sort column value
    aFilterButtons.sort(function(a,b) {
        if(a.dataset.buttonSort < b.dataset.buttonSort) return -1;
        if(a.dataset.buttonSort > b.dataset.buttonSort) return 1;
        return 0;
    });
    //Insert row and cell and loop through array appending buttons
    var filterTableRow = filterTable.insertRow();
    var filterButtons = filterTableRow.insertCell();
    filterButtons.dataset.filterLabel = button.caption;
    aFilterButtons.forEach(function(button) {filterButtons.appendChild(button)});
    filterTableRow.appendChild(filterButtons);
};

FilteredDataset.prototype.clearFiltersButtonClick = function() {
    //Clear buttons classes
    this.setFilterButtonState();
    this.j_FilterButtonsPressed = [];
    setLocalStorage(this.filterStorageName, []);
    //If we are showing tabs redraw each tab with cleared filters
    if(this.groupTabShow) {
        this.groupTabCollection.forEach(function(tab, index) {
            tab.replaceChild(this.drawTable(this.j_groupTabData[index], index), tab.querySelector('#' + this.pivotTableId + index));
        }, this);
        return;
    }
    //Redraw tables with cleared filters
    var pivotTable = this.o_Container.querySelector('#' + this.pivotTableId);
    pivotTable.parentNode.replaceChild(this.drawTable(this.j_Datastore, -1), pivotTable);
    return;
};

FilteredDataset.prototype.filterButtonClick = function(oButtonPressed) {
    var colIndex = Number(oButtonPressed.dataset.columnIndex);
    var colValueIndex = Number(oButtonPressed.dataset.columnValueIndex);
    var buttonSort = oButtonPressed.dataset.buttonSort;
    var buttonPressedIndex = -1;
    var buttonPressedAlready = -1;
    //Test if the button is currently pressed or if a button in group is pressed
    this.j_FilterButtonsPressed.some(function(button, index) {
        if(button.columnIndex === colIndex) {
            buttonPressedIndex = index;
            buttonPressedAlready = button.columnValueIndex.indexOf(colValueIndex);
            return true;
        }
    });

    if(buttonPressedIndex === -1) {
        //No button in group is pressed
        oButtonPressed.classList.add('active');
        this.j_FilterButtonsPressed.push( {
            filterLabel: oButtonPressed.parentElement.dataset.filterLabel,
            columnIndex: colIndex,
            columnValueIndex: [colValueIndex],
            buttonSort: [buttonSort]
        });
    }
    else if(buttonPressedAlready === -1) {
        //Another button in group is pressed
        oButtonPressed.classList.add('active');
        this.j_FilterButtonsPressed[buttonPressedIndex].columnValueIndex.push(colValueIndex);
        this.j_FilterButtonsPressed[buttonPressedIndex].buttonSort.push(buttonSort);
    }
    else {
        //Deactivate button
        oButtonPressed.classList.remove('active');
        this.j_FilterButtonsPressed[buttonPressedIndex].columnValueIndex.splice(buttonPressedAlready, 1);
        this.j_FilterButtonsPressed[buttonPressedIndex].buttonSort.splice(buttonPressedAlready, 1);
        this.j_FilterButtonsPressed[buttonPressedIndex].columnValueIndex.length === 0 && this.j_FilterButtonsPressed.splice(buttonPressedIndex, 1);
    }
    //Store current button state
    setLocalStorage(this.filterStorageName, this.j_FilterButtonsPressed);
    //Redraw tables based on current filters
    if(this.groupTabShow) {
        this.groupTabCollection.forEach(function(tab, index) {
            var pivotTable = tab.querySelector('#' + this.pivotTableId + index);
            this.j_FilterButtonsPressed.length === 0 ? tab.replaceChild(this.drawTable(this.j_groupTabData[index], index), pivotTable) : tab.replaceChild(this.drawTable(this.filterDataset(this.j_groupTabData[index]), index), pivotTable);
        }, this);
        return;
    }
    var pivotTable = this.o_Container.querySelector('#' + this.pivotTableId);
    this.j_FilterButtonsPressed.length === 0 ? pivotTable.parentNode.replaceChild(this.drawTable(this.j_Datastore, -1), pivotTable) : pivotTable.parentNode.replaceChild(this.drawTable(this.filterDataset(this.j_Datastore), -1), pivotTable);
    return;
};

FilteredDataset.prototype.filterDataset = function(oDataStore) {
    var filteredRows = oDataStore.rows.filter(function(row) {
        var test = [];
        this.j_FilterButtonsPressed.forEach(function(button) {
            button.columnValueIndex.indexOf(row[button.columnIndex]) === -1 ? test.push(false) : test.push(true);
        });
        return test.every(function(t) {return t === true});
    }, this);

    return {
        columns : this.j_Datastore.columns,
        rows : filteredRows
    };
};

FilteredDataset.prototype.drawGroupTabs = function(tabColumnValues) {
    var tabContainer = document.createElement('DIV');
    var tabButtonsContainer = document.createElement('DIV');
    tabButtonsContainer.classList.add('tabContainer');
    tabContainer.appendChild(tabButtonsContainer);
    this.groupTabCollection = [];
    this.groupTabButtons = [];
    for(let x=0; x < tabColumnValues.length; ++x) {
        //Create button
        var tabButton = document.createElement('BUTTON');
        tabButton.type = 'button';
        tabButton.textContent = tabColumnValues[x];
        tabButton.addEventListener('click', this.groupTabToggle.bind(this, x));
        tabButton.className = 'tabButton';
        this.groupTabButtons.push(tabButton);
        tabButtonsContainer.appendChild(tabButton);
        //Create div for tab and hide
        var tabDiv = document.createElement('DIV');
        tabDiv.id = 'groupTab' + x;
        tabDiv.style.display = 'none';
        this.groupTabCollection.push(tabDiv);
    }
    this.groupTabCollection.forEach(function(div) {tabContainer.appendChild(div)});
    return tabContainer;
};

FilteredDataset.prototype.groupTabToggle = function(tabButtonId) {
    this.groupTabCollection.forEach(function(tab, index) {
        if(tabButtonId === index) {
            tab.style.display = 'block';
            this.groupTabButtons[index].classList.add('tabButtonActive');
        }
        else {
            tab.style.display = 'none';
            this.groupTabButtons[index].classList.remove('tabButtonActive');
        }
    }, this);
    //Store status for open tab
     setLocalStorage(this.tabStorageName, tabButtonId);
};

FilteredDataset.prototype.drawTable = function(oDataStore, currentTabIndex) {
    return this.groupColumn === true ? this.drawGroupTable(oDataStore, currentTabIndex) : this.drawPivotTable(oDataStore, currentTabIndex);
};

FilteredDataset.prototype.drawPivotTable = function(oDataStore, currentTabIndex) {
    var pivotTable = document.createElement('TABLE');
    pivotTable.className = 'pivotTable';
    pivotTable.id = this.pivotTableId;
    //HEADER
    var pivotTableHead = pivotTable.createTHead();
    var pivotHeadRow = pivotTableHead.insertRow();
    //BODY
    var pivotTableBody = document.createElement('TBODY');
    var iRowPivotCount = oDataStore.columns[this.pivotRowIndex].values.length;
    var iColumnPivotCount = oDataStore.columns[this.pivotColumnIndex].values.length;
    var iRowCount = oDataStore.rows.length;
    var sRowValues = oDataStore.columns[this.pivotRowIndex].values;
    var sColumnValues = oDataStore.columns[this.pivotColumnIndex].values;

    //DRAW TABLE HEADER
    for(let x = 0; x < iColumnPivotCount; x++) {
        if (x === 0) {
            var pivotHeadColumn = document.createElement('TH');
            pivotHeadRow.appendChild(pivotHeadColumn);
        }
        var pivotHeadColumn = document.createElement('TH');
        pivotHeadColumn.textContent = sColumnValues[x];
        pivotHeadRow.appendChild(pivotHeadColumn);
    };

    if(this.showTotal === true) {
        var pivotHeadColumn = document.createElement('TH');
        pivotHeadColumn.textContent = 'Total';
        pivotHeadRow.appendChild(pivotHeadColumn);
    };

    //DRAW TABLE BODY
    for(let y = 0; y < iRowPivotCount; y++) {
        var pivotRow = pivotTableBody.insertRow();
        var pivotRowTotal = 0;

        for(let x = 0; x < iColumnPivotCount; x++) {
            if(x === 0) {
                var pivotColumnTitle = pivotRow.insertCell();
                pivotColumnTitle.textContent = sRowValues[y];
            };
            var cellValue = 0;
            var pivotColumn = pivotRow.insertCell();
            for(let iRow = 0; iRow < iRowCount; iRow++) {
                var yIndex = oDataStore.rows[iRow][this.pivotRowIndex];
                var xIndex = oDataStore.rows[iRow][this.pivotColumnIndex];

                if(xIndex === x && yIndex === y) {
                    cellValue += oDataStore.rows[iRow][this.measureColumnIndex];
                }
            };
            pivotRowTotal += cellValue;
            pivotColumn.textContent = cellValue;
        }
        //row total column here
        if( this.showTotal === true) {
            var pivotRowTotalCell = pivotRow.insertCell();
            pivotRowTotalCell.classList.add('totalCell');
            pivotRowTotalCell.textContent = pivotRowTotal;
        }
    };

    //DRAW TABLE FOOTER
    if( this.showTotal === true) {
        var pivotTableFooter = pivotTable.createTFoot();
        var pivotFooterRow = pivotTableFooter.insertRow();
        var pivotFooterRowTitle = pivotFooterRow.insertCell();
        pivotFooterRowTitle.textContent = 'Total';

        var pivotFooterTotal = 0;
        for(let x = 0; x < iColumnPivotCount; x++) {
            var cellValue = 0;
            var pivotFooterCell = pivotFooterRow.insertCell();
            for(let iRow = 0; iRow < iRowCount; iRow++ ) {
                var xIndex = oDataStore.rows[iRow][this.pivotColumnIndex];
                if ( xIndex === x ) {
                    cellValue += oDataStore.rows[iRow][this.measureColumnIndex];
                }
            };
            pivotFooterTotal += cellValue;
            pivotFooterCell.textContent = cellValue;
        }
        var pivotFooterTotalCell = pivotFooterRow.insertCell();
        pivotFooterTotalCell.textContent = pivotFooterTotal;
    }

    pivotTable.appendChild(pivotTableBody);
    return pivotTable;
};

FilteredDataset.prototype.drawGroupTable = function(oDataStore, currentTabIndex) {
    var aGroupValues = oDataStore.columns[this.pivotColumnIndex].values;
    var aRowValues = oDataStore.columns[this.pivotRowIndex].values;
    var groupDataTable = document.createElement('TABLE');
    groupDataTable.id = currentTabIndex === -1 ? this.pivotTableId : this.pivotTableId + currentTabIndex;
    groupDataTable.addEventListener('click', function(e) {
        const dci = Number(e.target.parentNode.dataset.columnIndex);
        const dcvi = Number(e.target.parentNode.dataset.columnValueIndex);
        if(!isNaN(dci) && !isNaN(dcvi)) {
            this.togglePatientModal(oDataStore, dci, dcvi);
        }
    }.bind(this));
    groupDataTable.classList.add('groupDataTable');
    var groupDataTableRow = groupDataTable.insertRow();
    var overallTotal = 0;
    for(let x=0; x < aGroupValues.length; x++) {
        //filter row for each group and find active column values for the group
        var validColumnIndexes = [];
        var filteredRows = oDataStore.rows.filter(function(row) {return row[this.pivotColumnIndex] === x}, this);
        if(this.groupTabShow) {
            this.j_Datastore.rows.forEach(function(row) {
                row[this.groupTabIndex] === currentTabIndex && row[this.pivotColumnIndex] === x && validColumnIndexes.indexOf(row[this.pivotRowIndex]) === -1 && validColumnIndexes.push(row[this.pivotRowIndex])
            }, this);
        }
        else {        
            this.j_Datastore.rows.forEach(function(row) {
                row[this.pivotColumnIndex] === x && validColumnIndexes.indexOf(row[this.pivotRowIndex]) === -1 && validColumnIndexes.push(row[this.pivotRowIndex])
            }, this);
        }
        //Don't draw groups not in the group tab
        if(validColumnIndexes.length > 0){
            //DRAW TABLE
            var tableTotal = 0;
            var pivotTable = document.createElement('TABLE');
            pivotTable.className = 'groupTable';
            //HEADER
            var pivotTableHead = pivotTable.createTHead();
            var pivotHeadRow = pivotTableHead.insertRow();
            var pivotHeadColumn = document.createElement('TH');
            pivotHeadColumn.textContent = aGroupValues[x];
            pivotHeadColumn.colSpan = 2;
            pivotHeadRow.appendChild(pivotHeadColumn);
            var pivotTableBody = document.createElement('TBODY');
            //BODY
            for(let y=0; y < validColumnIndexes.length; y++) {
                var cellValue = 0;
                var pivotRow = pivotTableBody.insertRow();
                pivotRow.insertCell().textContent = aRowValues[validColumnIndexes[y]];
                for(let i=0; i < filteredRows.length; i++) {
                    if(validColumnIndexes[y] === filteredRows[i][this.pivotRowIndex]) {
                        cellValue += filteredRows[i][this.measureColumnIndex];
                    }
                }
                tableTotal += cellValue;
                if (cellValue !== 0) {
                    pivotRow.dataset.columnIndex = x;
                    pivotRow.dataset.columnValueIndex = validColumnIndexes[y];
                }
                pivotRow.insertCell().textContent = cellValue;
            }
            pivotTable.appendChild(pivotTableBody);
            //FOOTER
            if(this.showTotal === true) {
                var pivotFooterRow = pivotTable.createTFoot().insertRow();
                pivotFooterRow.insertCell().textContent = 'Total';
                pivotFooterRow.insertCell().textContent = tableTotal;
                if (tableTotal !== 0) {
                    pivotFooterRow.dataset.columnIndex = x;
                    pivotFooterRow.dataset.columnValueIndex = -1;
                }
            }
            groupDataTableRow.insertCell().appendChild(pivotTable);
            overallTotal += tableTotal;
        }
    }
    if(this.showTotal === true) {
    //GROUP HEADER
        var groupTableHead = groupDataTable.createTHead();
        var groupHeadRow = groupTableHead.insertRow();
        var groupHeadColumn = document.createElement('TH');
        groupHeadRow.dataset.columnIndex = -1;
        groupHeadRow.dataset.columnValueIndex = -1;
        groupHeadColumn.textContent = 'Total - ' + overallTotal;
        groupHeadColumn.colSpan = aGroupValues.length;
        groupHeadRow.appendChild(groupHeadColumn);
    }
    return groupDataTable;
};

FilteredDataset.prototype.drawPatientList = function(oDataStore, colIndex, colValueIndex) {
    //MODAL HEADER
    //ACTIVE FILTERS
    while(this.modalHeader.firstChild) {
        this.modalHeader.removeChild(this.modalHeader.firstChild);
    }

    var modalHeaderTable = document.createElement('TABLE');
    var modalHeaderRow = modalHeaderTable.insertRow();
    var divCaption = colIndex !== -1 ? oDataStore.columns[this.pivotColumnIndex].values[colIndex] : 'All Divisions';
    var wardCaption = colValueIndex !== -1 ? oDataStore.columns[this.pivotRowIndex].values[colValueIndex] : 'All Wards';
    var filterCaption = document.createElement('H1');

    filterCaption.textContent = divCaption + ' - ' + wardCaption;
    modalHeaderRow.insertCell().appendChild(filterCaption);
    
    var modalHeaderCell = modalHeaderRow.insertCell();

    this.j_FilterButtonsPressed.forEach(function(button) {
        var filterCrumb = document.createElement('UL');
        var filterTitle = document.createElement('LI');
        var filterCrumbList = [];
        filterCrumb.classList.add('filterList');
        filterTitle.textContent = button.filterLabel;
        filterCrumb.appendChild(filterTitle);

        for(let x=0; x < button.columnValueIndex.length; x++) {
            var filterCrumbElement = document.createElement('LI');
            filterCrumbElement.dataset.listSort = button.buttonSort[x];
            filterCrumbElement.textContent = oDataStore.columns[button.columnIndex].values[button.columnValueIndex[x]];
            filterCrumbList.push(filterCrumbElement);
        }

        filterCrumbList.sort(function(a,b) {
            if(a.dataset.listSort < b.dataset.listSort) return -1;
            if(a.dataset.listSort > b.dataset.listSort) return 1;
            return 0;
        });

        filterCrumbList.forEach(function(list) {filterCrumb.appendChild(list)});
        modalHeaderCell.appendChild(filterCrumb);
    }, this);

    this.modalHeader.appendChild(modalHeaderTable);

    //MODAL BODY
    while(this.modalBody.firstChild) {
        this.modalBody.removeChild(this.modalBody.firstChild);
    }
    //PATIENT LIST

    //EXPORT TO CSV BUTTON
    var csvButton = document.createElement('BUTTON');
    csvButton.type='button';
    csvButton.classList.add('exportCsv');
    csvButton.innerHTML ='<img style="width:100%;height:100%;" src="../samples/js/Edd/FilteredDataset/exportCsv.png">';
    csvButton.addEventListener('click', this.exportPatientList.bind(this, oDataStore, colIndex, colValueIndex));
    this.modalBody.appendChild(csvButton);

    var patientList = document.createElement('TABLE');
    patientList.classList.add('patientList');
    //HEADER
    var patientHeader = patientList.createTHead();
    var patientHeaderRow = patientHeader.insertRow();
    var detailsColumnLength = this.detailTableColumns.length;

    for(let x=0; x < detailsColumnLength; x++) {
        var patientHeaderCell = document.createElement('TH');
        patientHeaderCell.textContent = oDataStore.columns[this.detailTableColumns[x]].name;
        patientHeaderRow.appendChild(patientHeaderCell);
    }

    var filteredRows = oDataStore.rows.filter(function(row) {
        return (row[this.pivotColumnIndex] === colIndex || colIndex === -1) && (row[this.pivotRowIndex] === colValueIndex || colValueIndex === -1);
    }, this);

    //BODY
    var patientBody = document.createElement('TBODY');

    for(let y=0; y < filteredRows.length; y++) {
        var patientBodyRow = patientBody.insertRow();
        for(let x=0; x < detailsColumnLength; x++ ) {
            var patientBodyCell = patientBodyRow.insertCell();
            var columnIndex = this.detailTableColumns[x];
            var cellValue = filteredRows[y][columnIndex];
            oDataStore.columns[x].dataType === 'string' ? patientBodyCell.textContent = oDataStore.columns[columnIndex].values[cellValue] : patientBodyCell.textContent = cellValue;
        }
    }

    patientList.appendChild(patientBody);
    this.modalBody.appendChild(patientList);
};

FilteredDataset.prototype.getParameters = function(oControlHost) {

};

FilteredDataset.prototype.setData = function(oControlHost, oDataStore) {
    var aColumns = [];
    var aRows = [];
    this.groupColumn = this.m_oConfiguration['group'] || false;
    this.showTotal = this.m_oConfiguration['total'] || true;
    this.pivotRowIndex = oDataStore.getColumnIndex(this.m_oConfiguration['row']);
    this.pivotColumnIndex = oDataStore.getColumnIndex(this.m_oConfiguration['column']);
    this.measureColumnIndex = oDataStore.getColumnIndex(this.m_oConfiguration['measure']);
    this.groupTabShow = this.m_oConfiguration['groupTab']['show'] || false;
    this.groupTabIndex = oDataStore.getColumnIndex(this.m_oConfiguration['groupTab']['value']);
        
    this.filterButtons = this.m_oConfiguration['filters'].map(function(filter) {
        return {
            valueIndex: oDataStore.getColumnIndex(filter.value),
            sortIndex: oDataStore.getColumnIndex(filter.sort),
            caption: filter.caption
        }
    });

    this.detailTableColumns = this.m_oConfiguration['detailColumns'].map(function(detail) {return oDataStore.getColumnIndex(detail)});

    for(let iCol = 0; iCol < oDataStore.columnCount; iCol++) {
        aColumns[iCol] = {
            name : oDataStore.columnNames[iCol],
            dataType : oDataStore.dataTypes[iCol],
            values : oDataStore.columnFormattedValues[iCol] || oDataStore.columnValues[iCol],
        };
    }
    for(let iRow = 0; iRow < oDataStore.rowCount; iRow++) {
        var aRow = [];
        for(var iCol = 0; iCol < oDataStore.columnCount; iCol++) {
            (oDataStore.dataTypes[iCol] === 'number') ? aRow.push(oDataStore.getCellValue(iRow, iCol)) : aRow.push(oDataStore.getCell(iRow, iCol).valueIndex);
        }
        aRows.push(aRow);
    }

    this.j_Datastore = {
        columns : aColumns,
        rows : aRows
    };
           
    if(this.groupTabShow) {
        this.j_groupTabData = [];
        for(var i=0; i < this.j_Datastore.columns[this.groupTabIndex].values.length; i++) {
            this.j_groupTabData.push({
                columns: this.j_Datastore.columns,
                rows: this.j_Datastore.rows.filter(function(row) {return row[this.groupTabIndex] === i}, this)
            });
        }
    }
};

FilteredDataset.prototype.exportPatientList = function(oDataStore, colIndex, colValueIndex) {
    var rows = oDataStore.rows;
    var CSV = '\r\n';
    //Filters
    var divCaption = colIndex !== -1 ? oDataStore.columns[this.pivotColumnIndex].values[colIndex] : 'All Divisions';
    var wardCaption = colValueIndex !== -1 ? oDataStore.columns[this.pivotRowIndex].values[colValueIndex] : 'All Wards';

    CSV += divCaption + ' - ' + wardCaption + '\r\n';

    this.j_FilterButtonsPressed.forEach(function(button) {
        var row = button.filterLabel +': ';
        var filters = [];
        for(let x=0; x < button.columnValueIndex.length; x++) {
            filters.push({
                sort: button.buttonSort[x],
                value: oDataStore.columns[button.columnIndex].values[button.columnValueIndex[x]]
            });
        }

        filters.sort(function(a,b) {
            if(a.sort < b.sort) return -1;
            if(a.sort > b.sort) return 1;
            return 0;
        });

        filters.forEach(function(list) {row += list.value + ' | '});
        row = row.slice(0, -1);
        row += '\r\n';
        CSV += row;
    }, this);

    //Headers
    var detailsColumnLength = this.detailTableColumns.length;
    var headerRow = '\r\n';
    for(let x=0; x < detailsColumnLength; x++) {
        headerRow += oDataStore.columns[this.detailTableColumns[x]].name + ',';
    }
    headerRow = headerRow.slice(0, -1);
    headerRow += '\r\n';
    CSV += headerRow;
    //Row Values
    var filteredRows = oDataStore.rows.filter(function(row) {
        return (row[this.pivotColumnIndex] === colIndex || colIndex === -1) && (row[this.pivotRowIndex] === colValueIndex || colValueIndex === -1)
    }, this);
    var rowLength = filteredRows.length;

    for(let y=0; y < rowLength; y ++) {
        var row = '';
        for(let x=0; x < detailsColumnLength; x++) {
            var columnIndex = this.detailTableColumns[x];
            var cellValue = filteredRows[y][columnIndex];
            oDataStore.columns[x].dataType === 'string' ? row += oDataStore.columns[columnIndex].values[cellValue] + ',' : row += cellValue + ',';
        }
        row = row.slice(0, -1);
        row += '\r\n';
        CSV += row;
    }

    var fileName = 'PatientList';
    if (window.navigator.msSaveBlob) {
        var blob = new Blob([CSV], {type: 'text/csv;charset=utf-8;'});
        window.navigator.msSaveOrOpenBlob(blob, fileName + '.csv');
    }
    else {
        var link = document.createElement('a');
        var uri = 'data:text/csv;charset=utf-8,' + encodeURI(CSV);
        link.href = uri;
        //set the visibility hidden so it will not effect on your web-layout
        link.style.cssText = 'visibility:hidden';
        link.download = fileName + '.csv';
        //this part will append the anchor tag and remove it after automatic click
        this.o_Container.appendChild(link);
        link.click();
        this.o_Container.removeChild(link);
    }
};

return FilteredDataset;
});