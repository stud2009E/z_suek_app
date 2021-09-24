sap.ui.define([
	'sap/ui/test/opaQunit',
	"./pages/Welcome"
], function (opaTest) {
	"use strict";

	QUnit.module("Welcome test");

	opaTest("Should start the app and see table with 10 rows", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();
		// Assertions
		Then.onMain.iShouldSee10EntriesInSmartTable();
        // Cleanup
		Then.iTeardownMyApp();
	});

});
