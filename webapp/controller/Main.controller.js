sap.ui.define([
    "./BaseController",
    "sap/m/Column",
    "sap/m/Text",
    "sap/ui/core/Fragment",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/DatePicker",
    "sap/ui/core/Item",
    "sap/m/VBox",
    "sap/m/ColumnListItem",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/ValueState",
    "sap/ui/core/CustomData"
], function (
    BaseController,
    Column,
    Text,
    Fragment,
    Input,
    Select,
    DatePicker,
    Item,
    VBox,
    ColumnListItem,
    Filter,
    FilterOperator,
    DateFormat,
    Spreadsheet,
    ValueState,
    CustomData
) {
    "use strict";

    var oModel = null;
    var oTable = null;
    var oDateParse = null;
    var oDateFormat = null;

    return BaseController.extend("z.suek.app.controller.Main", {

        onInit : function () {
            this.getRouter().getRoute("main").attachMatched(this._onRouteMatch, this);

            oModel = this.getModel("local");
            oTable = this.byId("taskTable");

            oDateParse = DateFormat.getDateInstance({
                pattern: "YYYYMMdd"
            });
            oDateFormat = DateFormat.getDateInstance({
                pattern: "dd.MM.YYYY"
            });

            oTable.setModel(oModel, "column");
            oTable.setModel(oModel, "row");
        },

        /**
         * handle route match event
         * @param {sap.ui.base.Event} oEvent 
         */
        _onRouteMatch: function(oEvent){
            var oArgs = oEvent.getParameter("arguments");
            var oQuery = oArgs["?query"];

            if(!oQuery || !oQuery.state){
                this.setMode("read");
                return;
            }

            if(oQuery.state === "edit"){
                oModel.setProperty("/state/edit", true);
                this._aDataCopy = JSON.parse(JSON.stringify(oModel.getProperty("/data")));
            }else if(oQuery.state === "read"){
                oModel.setProperty("/state/edit", false);
                this._aDataCopy = null;
            }else{
                this.setMode("read");
            }
        },

        setMode: function(sMode){
            this.getRouter().navTo("main",{
                query:{
                    state: sMode
                }
            }, true);
        },

        onFBClear: function(oEvent){
            var aSelectionSet = oEvent.getParameter("selectionSet");

            aSelectionSet && aSelectionSet.forEach(function(oItem){
                if(oItem.setValue){
                    oItem.setValue(null);
                }

                if(oItem.setSelectedKey){
                    oItem.setSelectedKey(null);
                }
            });
        },

        onFBReset: function(oEvent){
            this.onFBClear(oEvent);
            this.onFBSearch(oEvent);
        },

        onFBSearch: function(oEvent){
            var oRowsBinding = oTable.getBinding("items");
            var oFilterBar = oEvent.getSource();
            var aFilters = [];
            var aFilterGroupItems = oFilterBar.getFilterGroupItems();
            
            aFilterGroupItems.forEach(function(oGroupItem){
                var sPath = oGroupItem.getName();
                var oControl = oGroupItem.getControl();
                var oFilter = null;
                switch (sPath) {
                    case "taskType":
                        if(oControl.getSelectedKey()){
                            oFilter = new Filter({
                                path: sPath,
                                operator: FilterOperator.EQ,
                                value1: oControl.getSelectedKey()
                            });
                        }
                        break;
                    case "responsible":
                        if(oControl.getValue()){
                            oFilter = new Filter({
                                path: sPath,
                                operator: FilterOperator.EQ,
                                value1: oControl.getValue()
                            });
                        }
                        break;
                    case "startDate":
                        if(oControl.getValue()){
                            oFilter = new Filter({
                                path: sPath,
                                operator: FilterOperator.GE,
                                value1: oControl.getValue()
                            });
                        }
                        break;
                    case "endDate":
                        if(oControl.getValue()){
                            oFilter = new Filter({
                                path: sPath,
                                operator: FilterOperator.LE,
                                value1: oControl.getValue()
                            });
                        }
                        break;
                }
                if(oFilter){
                    aFilters.push(oFilter);
                }
            });

            if(!oRowsBinding){
                return;
            }

            if(aFilters.length > 0){
                oRowsBinding.filter( aFilters);
            }else{
                oRowsBinding.filter([]);
            }
        },

        onSetupColumns: function(){
            var oView = this.getView();

            if(!this._dialog){
                oView.setBusy(true);

                Fragment.load({
                    name: "z.suek.app.fragment.ColumnSetupDialog",
                    controller: this
                }).then(function(oDialog){
                    
                    this._dialog = oDialog;
                    oView.addDependent(this._dialog);
                    this._dialog.open();

                }.bind(this)).finally(function(){
                    oView.setBusy(false);
                });
            }else{
                this._dialog.open();
            }
        },

        onColumnSettingsClose: function(oEvent){
            var oDialog = oEvent.getSource().getParent();
            oDialog.close();
        },

        onCreateNewTask: function(){
            var oTask = {
                task: "",
                taskType: null,
                responsible: "",
                startDate: oDateFormat.format(new Date()),
                endDate: null,
                isNew: true
            };

            var aData = oModel.getProperty("/data");
            aData.splice(0, 0, oTask);

            oModel.updateBindings(true);
        },

        onEditTasks: function(){
            var oBinding = oTable.getBinding("items");
            oBinding && oBinding.filter([]);

            oTable.getColumns().forEach(function(oColumn){
                oColumn.setVisible(true);
            });

            this.setMode("edit");
        },

        onSaveTasks: function(){
            var bHasError = false;
            var aItems = oTable.getItems();

            function isDateValid(sDate){
                return oDateFormat.parse(sDate) !== null;
            }

            aItems.forEach(function(oItem){
                var oStartDate = null;
                var oEndDate = null;
                oItem.getCells().forEach(function(oVBox){
                    var oEditControl = oVBox.getItems()[0];
                    if(!oVBox.data("value")){
                        oEditControl.setValueState(ValueState.Error);
                        bHasError = true;
                    }

                    if(oEditControl.data("datePicker") === "startDate"){
                        oStartDate = oEditControl;
                    }
                    if(oEditControl.data("datePicker") === "endDate"){
                        oEndDate = oEditControl;
                    }
                });
                
                if(!isDateValid(oStartDate.getValue())){
                    oStartDate.setValueState(ValueState.Error);
                        bHasError = true;
                }
                if(!isDateValid(oEndDate.getValue())){
                    oEndDate.setValueState(ValueState.Error);
                        bHasError = true;
                }

                if(oStartDate.getDateValue() && oEndDate.getDateValue()){
                    if(oStartDate.getDateValue().getTime() > oEndDate.getDateValue().getTime()){
                        oEndDate.setValueState(ValueState.Error);
                        bHasError = true;
                    }
                }
            });
            
            if(bHasError){
                return;
            }
            
            this.setMode("read");
        },
        
        onCancelTasksEdit: function(){
            if(this._aDataCopy){
                oModel.setProperty("/data", this._aDataCopy);
                oModel.updateBindings();
            }

            this.setMode("read");
        },

        onValueHelpResponsibleRequest: function(oEvent){
            var oView = this.getView();
            var oInput = oEvent.getSource();
            
            oView.setBusy(true);

            Fragment.load({
                name: "z.suek.app.fragment.ResponsibleUsersVH",
                controller: this
            })
            .then(function(oValueHelp){
                oView.addDependent(oValueHelp);
                oValueHelp.addStyleClass("sapUiSizeCompact");
                oValueHelp.data("input", oInput);

                oValueHelp.attachAfterClose(function(){
                    oValueHelp.destroy();
                    oValueHelp = null;
                });

                oValueHelp.getTableAsync().then(function (oTable) {
                    oTable.setModel(oModel);
                    oTable.setModel(oModel, "columns");

                    if(oTable.bindRows){
                        oTable.bindAggregation("rows", {
                            path:"/persons"
                        });
                    }

                    if(oTable.bindItems){
                        oTable.bindAggregation("items",{
                            path: "/persons", 
                            factory: function () {
                                return new ColumnListItem({
                                    cells: [
                                        new Text({ text:"{name}"})
                                    ]
                                });
                            }
                        });
                    }
                    oValueHelp.update();
                }.bind(this));

                oValueHelp.open();
            }.bind(this))
            .finally(function(){
                oView.setBusy(false);
            });
        },

        onValueHelpOkPress: function(oEvent){
            var oValueHelp = oEvent.getSource();
            var oInput = oValueHelp.data("input");
            var aTokens = oEvent.getParameter("tokens");
            
			oInput.setValue(aTokens[0].getText());
            oInput.fireChange({
                value: aTokens[0].getText()
            });

			oValueHelp.close();
        },

        onValueHelpCancelPress: function(oEvent){
            var oValueHelp = oEvent.getSource();
            oValueHelp.close();
        },

        columnFactory: function(sId){
            return new Column(sId, {
                visible: "{column>visible}",
                header: new Text({
                    text: "{column>label}"
                })
            });
        },

        columnListItemFactory: function(sId, oRowCtx){
            var that = this;
            var oCli = new ColumnListItem();

            oCli.bindAggregation("cells", {
                path: "column>/columns",
                factory: function(sId, oClmnCtx){
                    return that.cellFactory(oClmnCtx, oRowCtx);
                }
            })

            return oCli;
        },

        cellFactory: function(oClmnCtx, oRowCtx){
            var sField = oClmnCtx.getProperty("field");

            var oReadVisibleBinding = {
                path: "local>/state/edit",
                formatter: function(bEdit){
                    return !bEdit; 
                }
            };
            var oInputVisibleBinding = {
                path: "local>/state/edit",
                formatter: function(bEdit){
                    return bEdit; 
                }
            };

            var oEditControl = null;
            var oText = new Text({
                visible: oReadVisibleBinding,
                text: "{row>" + sField + "}"
            });

            switch (sField) {
                case "task":
                    oEditControl = new Input({
                        change: function(oEvent){
                            var sValueState = this.getValue() ? ValueState.None : ValueState.Error; 
                            this.setValueState(sValueState);
                        },
                        value: {
                            path: "row>" + sField
                        },
                        visible: oInputVisibleBinding
                    });
                    break;

                case "taskType":
                    oEditControl = new Select({
                        visible: oInputVisibleBinding,
                        selectedKey: "{row>" + sField + "}",
                        change: function(oEvent){
                            var oItem = oEvent.getParameter("selectedItem");
                            var oCtx = this.getBindingContext("row");
                            var sValueState = this.getSelectedKey() ? ValueState.None : ValueState.Error; 
                            
                            oModel.setProperty(oCtx.getPath("taskTypeText"), oItem.getText());
                            this.setValueState(sValueState);
                        },
                        items: {
                            templateShareable: true,
                            path: "local>/taskTypes",
                            template: new Item({
                                key: "{local>key}",
                                text: "{local>text}"
                            })
                        }
                    });
                    oText = new Text({
                        visible: oReadVisibleBinding,
                        text: "{row>" + sField + "Text}"
                    });
                    break;

                case "responsible":
                    oEditControl = new Input({
                        visible: oInputVisibleBinding,
                        showValueHelp: true,
						valueHelpOnly: true,
                        value: {
                            path:"row>" + sField
                        },
                        change: function(oEvent){
                            var sValueState = this.getValue() ? ValueState.None : ValueState.Error; 
                            this.setValueState(sValueState);
                        },
                        valueHelpRequest: this.onValueHelpResponsibleRequest.bind(this),
                        suggestionItems:{
                            path:"local>/persons",
                            templateShareable:true,
							template: new Item({
                                key:"{local>id}",
                                text:"{local>name}"
                            })
                        }
                    });
                    break;
                    
                case "endDate":
                case "startDate":
                    oEditControl = new DatePicker({
                        visible: oInputVisibleBinding,
                        displayFormat: "dd.MM.YYYY",
                        valueFormat: "YYYYMMdd",
                        change: function(oEvent){
                            var sValueState = this.getValue() ? ValueState.None : ValueState.Error;
                            this.setValueState(sValueState);
                        },
                        value: {
                            path:"row>" + sField
                        }
                        
                    });
                    oEditControl.data("datePicker", sField);
                    oText = new Text({
                        visible: oReadVisibleBinding,
                        text: {
                            path: "row>" + sField,
                            formatter: function(sDate){
                                if(!sDate) return;
                                var oDate = oDateParse.parse(sDate);
                                return oDateFormat.format(oDate);
                            }
                        } 
                    });
                    break;
            }
            oText.setWrapping(false);

            var oVBox = new VBox({
                items: [oEditControl, oText]
            });

            oVBox.addCustomData(new CustomData({
                key: "value",
                value: {
                    path: "row>" + sField
                }
            }));

            return oVBox;
        },


        onFormExcelFile: function(){
            var aColumns = oModel.getProperty("/columns")
                .map(function(oUIColumn){
                    var oConfigColumn = {
                        label: oUIColumn.label,
                        property: oUIColumn.field,
                        width: '50'
                    };

                    if(oConfigColumn.property === "taskType"){
                        oConfigColumn.property += "Text";
                    }

                    return oConfigColumn;
                });

            var aData = (oTable.getBinding("items") || [])
                .getContexts()
                .map(function(oCtx){
                    return $.extend({}, oCtx.getObject());
                });

			var oSettings = {
				workbook: { columns: aColumns },
				dataSource: aData
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.finally(function() {
					oSheet.destroy();
				});
        }

    });

});