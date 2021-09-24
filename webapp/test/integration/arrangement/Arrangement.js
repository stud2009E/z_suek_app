sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/Properties"
],function(
	Opa5,
	Press,
	Properties
){
	"use strict";

	return Opa5.extend("z.suek.app.test.integration.arrangement.Arrangement", {
		iStartMyApp : function () {
			
			//try to open our application
			return this.iStartMyAppInAFrame("/fiori/index.html")
				.waitFor({
					controlType: "sap.m.GenericTile",
					actions: new Press(),
					matchers: new Properties({
						header: "z_suek_app"
					})
				});
		}
	});
});
