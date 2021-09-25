sap.ui.define([
    "./BaseController",
    "sap/ui/table/Column",
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
    "sap/ui/core/format/DateFormat"
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
    DateFormat
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
            var oRowsBinding = oTable.getBinding("rows");
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
                oRowsBinding.filter(null);
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
            oTable.getColumns().forEach(function(oColumn){
                oColumn.setVisible(true);
            });

            oModel.setProperty("/state/edit", true);
        },

        onSaveTasks: function(){
            oModel.setProperty("/state/edit", false);
            var aRows = oModel.getProperty("/data");
            aRows.forEach(function(oRow){
                delete oRow.bNew;
            });
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

			oValueHelp.close();
        },

        columnFactory: function(sId, oColumnCtx){
            var sLabel = oColumnCtx.getProperty("label");
            var oControl = this.templateFactory(oColumnCtx);

            return new Column(sId, {
                visible: "{column>visible}",
                label: sLabel,
                template: oControl
            });
        },


        templateFactory: function(oColumnCtx){
            var sField = oColumnCtx.getProperty("field");

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
                        value: "{row>" + sField + "}",
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
                            var oModel = oCtx.getModel();
                            oModel.setProperty(oCtx.getPath("taskTypeText"), oItem.getText())
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
                        value: "{row>" + sField + "}",
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
                case "startDate":
                    oEditControl = new DatePicker({
                        visible: oInputVisibleBinding,
                        displayFormat: "dd.MM.YYYY",
                        valueFormat: "YYYYMMdd",
                        value: {
                            path:"row>" + sField
                        },
                        maxDate: {
                            path: "row>endDate",
                            formatter: function(sEndDate){
                                if(!sEndDate) return null;
                                return oDateParse.parse(sEndDate);
                            }
                        }

                    });
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
                case "endDate":
                    oEditControl = new DatePicker({
                        visible: oInputVisibleBinding,
                        displayFormat: "dd.MM.YYYY",
                        valueFormat: "YYYYMMdd",
                        value: {
                            path:"row>" + sField,
                        },
                        minDate: {
                            path: "row>startDate",
                            formatter: function(sStartDate){
                                if(!sStartDate) return;
                                return oDateParse.parse(sStartDate);
                            }
                        }
                    });
                    oText = new Text({
                        visible: oReadVisibleBinding,
                        text: {
                            path: "row>" + sField,
                            formatter: function(sDate){
                                if(!sDate) return null;

                                var oDate = oDateParse.parse(sDate);
                                return oDateFormat.format(oDate);
                            }
                        } 
                    });
                    break;
            }

            oText.setWrapping(false);

            return new VBox({
                items: [oEditControl, oText]
            });
        }

    });

});