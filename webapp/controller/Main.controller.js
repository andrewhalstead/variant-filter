sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function (Controller, MessageToast) {
	"use strict";

	return Controller.extend("demo.variantfilter.controller.Main", {
		onInit: function () {
			const oFilterBar = this.getView().byId("idFilterBar");			
			oFilterBar.registerFetchData(this.getFilterBarData);
			oFilterBar.registerApplyData(this.setFilterBarData);
			const oPersInfo = new sap.ui.comp.smartvariants.PersonalizableInfo("idPersInfo", {
				keyName: "persistencyKey",
				type:    "filterBar"
			});
			oPersInfo.setControl(oFilterBar);
			const oSmartUi2Variant = this.getView().byId("idSmartUi2Variant");			
			oSmartUi2Variant.addPersonalizableControl(oPersInfo);
			oSmartUi2Variant.initialise();
		},
		onFilterSearch: function(oEvent) {
			const oFilterBar = this.byId("idFilterBar");	
			const aFilters = this.getFiltersFromFilterBar(oFilterBar);
			// the end date returned by the date range selection control is the beginning of the month, so get the last day in the month
			const oFilter = aFilters.find( f => f.sPath === "CreatedAt" );
			if (oFilter) {
				const oToDate = oFilter.oValue2;
				oFilter.oValue2 = new Date(oToDate.getFullYear(), oToDate.getMonth() + 1, 0);
			}
			// bind the filters to the List 
			const oList = this.byId("idSalesOrderList");	
			const oBindingInfo = oList.getBindingInfo("items");
			if (!oBindingInfo.path) {
				oList.bindItems({ 
					path: "/SalesOrderSet",
					template: oBindingInfo.template,
					templateShareable: false,
					filters: aFilters });
			} else {					
				const oListBinding = oList.getBinding("items");
				oListBinding.filter(aFilters, sap.ui.model.FilterType.Application);
			}
		},
		getFiltersFromFilterBar: function(oFilterBar) {
			const oFilterItems = oFilterBar.getAllFilterItems(true);
			let aFilters = [];
			oFilterItems.forEach( oFilterItem => {
				let name = oFilterItem.getName();
				let oControl = oFilterBar.determineControlByName(name);
				switch (oControl.getMetadata().getName()) {
					case "sap.m.Select":
					case "sap.m.ComboBox":	
						let sSelectedKey = oControl.getSelectedKey();
						if (sSelectedKey) {
							aFilters.push(new sap.ui.model.Filter(name, "EQ", sSelectedKey));
						} 
						break;
					case "sap.m.MultiComboBox":
						let aSelectedKeys = oControl.getSelectedKeys();
						if (aSelectedKeys) {
							aSelectedKeys.map( k => aFilters.push(new sap.ui.model.Filter(name, "EQ", k)) );
						}
						break;
					case "sap.m.DateRangeSelection":
						if (oControl.getDateValue() && oControl.getSecondDateValue()) {
							aFilters.push(new sap.ui.model.Filter(name, "BT", oControl.getDateValue(), oControl.getSecondDateValue()));
						}
						break;							
				}
			});
			return aFilters;
		},			
		getFilterBarData: function() {
			let oData = {};
			const aFilterItems = this.getAllFilterItems(true);
			aFilterItems.forEach( oFilterItem => {
				let name = oFilterItem.getName();
				let oControl = this.determineControlByName(name);
				switch (oControl.getMetadata().getName()) {
					case "sap.m.Select":
					case "sap.m.ComboBox":	
						oData[name] = oControl.getSelectedKey() || "";
						break;
					case "sap.m.MultiComboBox":
						oData[name] = oControl.getSelectedKeys() || [];
						break;		
					case "sap.m.DateRangeSelection":
						oData[name] = {
							fromDate: oControl.getDateValue(),
							toDate: oControl.getSecondDateValue()
						};
						break;	
				}
			});
			return oData;
		},
		setFilterBarData: function(oData) {
			for (let [key, value] of Object.entries(oData)) {
				let oControl = this.determineControlByName(key);
				if (oControl) {
					switch (oControl.getMetadata().getName()) {
						case "sap.m.Select":
						case "sap.m.ComboBox":	
							oControl.setSelectedKey(value);
							break;
						case "sap.m.MultiComboBox":
							oControl.removeAllSelectedItems();
							oControl.setSelectedKeys(value);
							break;						
						case "sap.m.DateRangeSelection":
							if (value.fromDate && value.toDate) {
								oControl.setDateValue(new Date(value.fromDate));
								oControl.setSecondDateValue(new Date(value.toDate));
							} else {
								oControl.setDateValue(null);
								oControl.setSecondDateValue(null);
							}							
							break;	
					}
				}
			}	
		},
		onFilterControlChange: function(oEvent) {
			const oControl = oEvent.getSource();
			const oFilterBar = this.byId("idFilterBar");	
			const oFilterItem = oFilterBar.getAllFilterItems(true).find( f => f.getControl() === oControl);
			let aSelectedKeys = [];
			switch (oControl.getMetadata().getName()) {
				case "sap.m.Select":
				case "sap.m.ComboBox":	
					if (oControl.getSelectedKey()) {
						aSelectedKeys.push(oControl.getSelectedKey());
					}
					break;
				case "sap.m.MultiComboBox":
					aSelectedKeys = oControl.getSelectedKeys();
					break;
				case "sap.m.DateRangeSelection":
					if (oControl.getDateValue() && oControl.getSecondDateValue()) {
						aSelectedKeys.push(oControl.getDateValue());
						aSelectedKeys.push(oControl.getSecondDateValue());
					}
					break;							
			}
			//MessageToast.show("Change filter item name is " + oFilterItem.getName() + ", selected keys are: " + aSelectedKeys);
		}
	});

});