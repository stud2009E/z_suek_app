sap.ui.define([
    "./BaseController"
], function (
    BaseController
) {
    "use strict";

    return BaseController.extend("z.suek.app.controller.App", {

        onInit : function () {
            var oView = this.getView();

            oView.addStyleClass(this.getOwnerComponent().getContentDensityClass());
        }

    });

});