sap.ui.define([
    "./BaseController",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/ui/core/Fragment",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/DatePicker",
    "sap/ui/core/Item",
    "sap/ui/model/type/Date",
    "sap/m/VBox"
], function (
    BaseController,
    Column,
    Text,
    Fragment,
    Input,
    Select,
    DatePicker,
    Item,
    DateType,
    VBox
) {
    "use strict";

    return BaseController.extend("z.suek.app.controller.Main", {

        onInit : function () {

            this.getRouter().getRoute("main").attachMatched(this._onRouteMatch, this);

            var oModel = this.getModel("local");
            var oTable = this.byId("taskTable");

            oTable.setModel(oModel, "column");
            oTable.setModel(oModel, "row");
        },

        /**
         * handle route match event
         * @param {sap.ui.base.Event} oEvent 
         */
        _onRouteMatch: function(oEvent){


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

        onColumnSettingsApply: function(oEvent){
            var oDialog = oEvent.getSource().getParent();
            oDialog.close();
        },

        onCreateNewTask: function(){
            var oModel = this.getModel("local");

            var oTask = {
                task: "",
                taskType: "none",
                responsible: "",
                startDate: new Date(),
                endDate: null,
                isNew: true
            };

            var aData = oModel.getProperty("/data");
            aData.splice(0, 0, oTask);

            oModel.updateBindings();
        },

        onEditTasks: function(){
            var oModel = this.getModel("local");
            var oTable = this.byId("taskTable");
            oTable.getColumns().forEach(function(oColumn){
                oColumn.setVisible(true);
            });

            oModel.setProperty("/state/edit", true);
        },

        onSaveTasks: function(){
            var oModel = this.getModel("local");
            oModel.setProperty("/state/edit", false);
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
                formatter: function(bNew, bEdit){
                    return !(!!bNew || !!bEdit) 
                }
            };
            var oInputVisibleBinding = {
                path: "local>/state/edit",
                formatter: function(bNew, bEdit){
                    return !!(bNew || bEdit); 
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
                        value: "{row>" + sField + "}"
                    });
                    break;
                case "startDate":
                    oEditControl = new DatePicker({
                        visible: oInputVisibleBinding,
                        value: {
                            path:"row>" + sField,
                            type: new DateType({
                                format: "YYYYMMdd"
                            })
                        },
                        maxDate: {
                            path:"row>endDate"
                        }
                    });
                    oText = new Text({
                        visible: oReadVisibleBinding,
                        text: {
                            path: "row>" + sField,
                            type: new DateType({
                                format: "YYYYMMdd"
                            })
                        } 
                    });
                    break;
                case "endDate":
                    oEditControl = new DatePicker({
                        visible: oInputVisibleBinding,
                        value: {
                            path:"row>" + sField,
                            type: new DateType({
                                format: "YYYYMMdd"
                            })
                        },
                        minDate: {
                            path:"row>startDate"
                        }
                    });
                    oText = new Text({
                        visible: oReadVisibleBinding,
                        text: {
                            path: "row>" + sField,
                            type: new DateType({
                                format: "YYYYMMdd"
                            })
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