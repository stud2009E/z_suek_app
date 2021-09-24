sap.ui.define([
	'sap/ui/test/Opa5',
	'sap/ui/test/matchers/AggregationLengthEquals'
], function (
	Opa5,
	AggregationLengthEquals
) {
	"use strict";

	Opa5.createPageObjects({
		onMain : {
			viewName : "Main",

			assertions: {

				iShouldSee10EntriesInSmartTable: function () {
					return this.waitFor({
						controlType: "sap.ui.table.Table",
						matchers: new AggregationLengthEquals({
                            length : 10,
                            name: "rows"
                        }),
						success : function () {
							Opa5.assert.ok(true, "The smart table must have 10 rows");
						},
						errorMessage : "The smart table has incorrect number of rows"
					});
				}
			}
		}
	});
});
