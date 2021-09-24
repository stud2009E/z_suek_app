sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device"
], function (
    UIComponent, 
    Device
) {
	"use strict";

	return UIComponent.extend("z.suek.app.Component", {

		metadata : {
			manifest : "json"
		},

		init : function () {

			UIComponent.prototype.init.apply(this, arguments);

			this.getRouter().initialize();
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class
		 */
		getContentDensityClass : function() {
			if (this._sContentDensityClass === undefined) {
				if ($(document.body).hasClass("sapUiSizeCozy") || $(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCozy";
				} else {
					this._sContentDensityClass = "sapUiSizeCompact";
				}
			}
			return this._sContentDensityClass;
		}

	});
});