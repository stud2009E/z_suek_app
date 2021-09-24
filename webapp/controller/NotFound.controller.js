sap.ui.define([
	"./BaseController"
], function (
    BaseController
){
    "use strict";

    return BaseController.extend("z.suek.app.controller.NotFound", {

        onInit: function () {
            this.getRouter().getTarget("notFound").attachDisplay(this._onNotFoundDisplayed, this);
        },

        _onNotFoundDisplayed: function(oEvent){
            
        }
        
    });
});
