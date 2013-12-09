/*
 * Copyright (c) 2012-2013 Axelor. All Rights Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://license.axelor.com/.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is part of "Axelor Business Suite", developed by
 * Axelor exclusively.
 *
 * The Original Developer is the Initial Developer. The Initial Developer of
 * the Original Code is Axelor.
 *
 * All portions of the code written by Axelor are
 * Copyright (c) 2012-2013 Axelor. All Rights Reserved.
 */
(function() {

'use strict';

var ui = angular.module('axelor.ui');

var OPERATORS = {
	"="		: _t("equals"),
	"!="	: _t("not equal"),
	">="	: _t("greater or equal"),
	"<="	: _t("less or equal"),
	">" 	: _t("greater than"),
	"<" 	: _t("less than"),

	"like" 		: _t("contains"),
	"notLike"	: _t("doesn't contain"),

	"between"		: _t("in range"),
	"notBetween"	: _t("not in range"),

	"isNull"	: _t("is null"),
	"notNull" 	: _t("is not null"),

	"true"		: _t("is true"),
	"false" 	: _t("is false")
};

var OPERATORS_BY_TYPE = {
	"string"	: ["=", "!=", "like", "notLike", "isNull", "notNull"],
	"integer"	: ["=", "!=", ">=", "<=", ">", "<", "between", "notBetween", "isNull", "notNull"],
	"boolean"	: ["true", "false"]
};

_.each(["long", "decimal", "date", "time", "datetime"], function(type) {
	OPERATORS_BY_TYPE[type] = OPERATORS_BY_TYPE.integer;
});

_.each(["text", "many-to-one", "one-to-many", "many-to-many"], function(type) {
	OPERATORS_BY_TYPE[type] = OPERATORS_BY_TYPE.string;
});

ui.directive('uiFilterItem', function() {

	return {
		replace: true,
		require: '^uiFilterForm',
		scope: {
			fields: "=",
			filter: "="
		},
		link: function(scope, element, attrs, form) {

			scope.getOperators = function() {

				if (element.is(':hidden')) {
					return;
				}

				var filter = scope.filter || {};
				if (filter.type === undefined) {
					return [];
				}

				return _.map(OPERATORS_BY_TYPE[filter.type], function(name) {
					return {
						name: name,
						title: OPERATORS[name]
					};
				});
			};

			scope.remove = function(filter) {
				form.removeFilter(filter);
			};

			scope.canShowInput = function() {
				return scope.filter &&
					   scope.filter.operator && !(
					   scope.filter.type == 'boolean' ||
					   scope.filter.operator == 'isNull' ||
					   scope.filter.operator == 'notNull');
			};

			scope.canShowRange = function() {
				return scope.filter && (
					   scope.filter.operator === 'between' ||
					   scope.filter.operator === 'notBetween');
			};

			scope.onFieldChange = function() {
				var filter = scope.filter,
					field = scope.fields[filter.field] || {};

				filter.type = field.type || 'string';

				if (field.type === 'many-to-one') {
					filter.targetName = field.targetName;
				}
			};

			var unwatch = scope.$watch('fields', function(fields, old) {
				if (_.isEmpty(fields)) return;
				unwatch();
				var options = _.values(fields);
				scope.options = _.sortBy(options, 'title');
			}, true);
		},
		template:
		"<div class='form-inline' style='margin-bottom: 5px;'>" +
			"<select ng-model='filter.field' ng-options='v.name as v.title for v in options' ng-change='onFieldChange()' class='input-medium'></select> " +
			"<select ng-model='filter.operator' ng-options='o.name as o.title for o in getOperators()' class='input-medium'></select> "+
			"<input type='text' ui-filter-input ng-model='filter.value' ng-show='canShowInput()' class='input-medium'> " +
			"<input type='text' ui-filter-input ng-model='filter.value2' ng-show='canShowRange()' class='input-medium'> " +
			"<a href='' ng-click='remove(filter)'><i class='icon icon-remove'></i></a>" +
		"</div>"
	};
});

ui.directive('uiFilterInput', function() {

	return {
		require: '^ngModel',

		link: function(scope, element, attrs, model) {

			var picker = null;

			var options = {
				dateFormat: 'dd/mm/yy',
				showButtonsPanel: false,
				showTime: false,
				showOn: null,
				onSelect: function(dateText, inst) {
					var value = picker.datepicker('getDate');
					var isValue2 = _.str.endsWith(attrs.ngModel, 'value2');

					value = isValue2 ? moment(value).endOf('day').toDate() :
						               moment(value).startOf('day').toDate();

					model.$setViewValue(value.toISOString());
				}
			};

			model.$formatters.push(function(value) {
				if (_.isDate(value)) {
					value = moment(value).format('DD/MM/YYYY');
				}
				return value;
			});

			element.focus(function(e) {
				var type = scope.filter.type;
				if (!(type == 'date' || type == 'datetime')) {
					return
				}
				if (picker == null) {
					picker = element.datepicker(options);
				}
				picker.datepicker('show');
			});

			element.on('$destroy', function() {
				if (picker) {
					picker.datepicker('destroy');
					picker = null;
				}
			});
		}
	};
});

FilterFormCtrl.$inject = ['$scope', '$element', 'ViewService'];
function FilterFormCtrl($scope, $element, ViewService) {

	this.doInit = function(model) {
		return ViewService
		.getFields(model)
		.success(function(fields) {
			var nameField = null;
			_.each(fields, function(field, name) {
				if (field.name === 'id' || field.name === 'version' ||
					field.name === 'archived' || field.name === 'selected') return;
				if (field.name === 'createdOn' || field.name === 'updatedOn') return;
				if (field.name === 'createdBy' || field.name === 'updatedBy') return;
				if (field.type === 'binary' || field.large) return;
				$scope.fields[name] = field;
				if (field.nameColumn) {
					nameField = name;
				}
			});
			$scope.$parent.fields = $scope.fields;
			$scope.$parent.nameField = nameField || ($scope.fields['name'] ? 'name' : null);
		});
	};

	$scope.fields = {};
	$scope.filters = [{}];
	$scope.operator = 'and';
	$scope.showArchived = false;

	var handler = $scope.$parent.handler;
	if (handler && handler._dataSource) {
		$scope.showArchived = handler._dataSource._showArchived;
	}

	$scope.addFilter = function(filter) {
		$scope.filters.push(filter || {});
	};

	this.removeFilter = function(filter) {
		var index = $scope.filters.indexOf(filter);
		if (index > -1) {
			$scope.filters.splice(index, 1);
		}
		if ($scope.filters.length === 0) {
			$scope.addFilter();
		}
	};

	$scope.$on('on:select-custom', function(e, custom) {

		$scope.filters.length = 0;

		if (custom.$selected) {
			select(custom);
		} else {
			$scope.addFilter();
		}

		return $scope.applyFilter();
	});

	$scope.$on('on:before-save', function(e, data) {
		var criteria = $scope.prepareFilter();
		if (data) {
			data.criteria = criteria;
		}
	});

	function select(custom) {

		var criteria = custom.criteria;

		$scope.operator = criteria.operator || 'and';

		_.each(criteria.criteria, function(item) {
			var filter = {
				field: item.fieldName,
				value: item.value,
				value2: item.value2
			};

			var field = $scope.fields[item.fieldName] || {};

			filter.type = field.type || 'string';
			filter.operator = item.operator;

			if (item.operator === '=' && filter.value === true) {
				filter.operator = 'true';
			}
			if (filter.operator === '=' && filter.value === false) {
				filter.operator = 'false';
			}

			if (field.type === 'date' || field.type === 'datetime') {
				if (filter.value) {
					filter.value = moment(filter.value).toDate();
				}
				if (filter.value2) {
					filter.value2 = moment(filter.value2).toDate();
				}
			}

			$scope.addFilter(filter);
		});
	}

	$scope.clearFilter = function() {
		$scope.filters.length = 0;
		$scope.addFilter();

		if ($scope.$parent.onClear) {
			$scope.$parent.onClear();
		}

		$scope.applyFilter();
	};

	$scope.prepareFilter = function() {

		var criteria = {
			archived: $scope.showArchived,
			operator: $scope.operator,
			criteria: []
		};

		_.each($scope.filters, function(filter) {

			if (!filter.field || !filter.operator) {
				return;
			}

			var criterion = {
				fieldName: filter.field,
				operator: filter.operator,
				value: filter.value
			};

			if (filter.targetName && (
					filter.operator !== 'isNull' ||
					filter.operator !== 'notNull')) {
				criterion.fieldName += '.' + filter.targetName;
			}

			if (criterion.operator == "true") {
				criterion.operator = "=";
				criterion.value = true;
			}
			if (criterion.operator == "false") {
				criterion = {
					operator: "or",
					criteria: [
					    {
					    	fieldName: filter.field,
						    operator: "=",
						    value: false
					    },
					    {
					    	fieldName: filter.field,
						    operator: "isNull"
					    }
					]
				};
			}

			if (criterion.operator == "between" || criterion.operator == "notBetween") {
				criterion.value2 = filter.value2;
			}

			criteria.criteria.push(criterion);
		});

		return criteria;
	};

	$scope.applyFilter = function(hide) {
		var criteria = $scope.prepareFilter();
		if ($scope.$parent.onFilter) {
			$scope.$parent.onFilter(criteria);
		}
		if ($scope.$parent && hide) {
			$scope.$parent.$broadcast('on:hide-menu');
		}
	};
	
	$scope.canExport = function() {
		var handler = $scope.$parent.handler;
		if (handler && handler.hasPermission) {
			return handler.hasPermission('export');
		}
		return true;
	};
}

ui.directive('uiFilterForm', function() {

	return {
		replace: true,

		scope: {
			model: '=',
			onSearch: '&'
		},

		controller: FilterFormCtrl,

		link: function(scope, element, attrs, ctrl) {

			ctrl.doInit(scope.model);
		},
		template:
		"<div class='filter-form'>" +
			"<form class='filter-operator form-inline'>" +
				"<label class='radio inline'>" +
					"<input type='radio' name='operator' ng-model='operator' value='and' x-translate><span x-translate>and</span>" +
				"</label>" +
				"<label class='radio inline'>" +
					"<input type='radio' name='operator' ng-model='operator' value='or' x-translate><span x-translate>or</span>" +
				"</label>" +
				"<label class='checkbox inline show-archived'>" +
					"<input type='checkbox' ng-model='showArchived'><span x-translate>Show archived</span>" +
				"</label>" +
			"</form>" +
			"<div ng-repeat='filter in filters' ui-filter-item x-fields='fields' x-filter='filter'></div>" +
			"<div class='links'>"+
				"<a href='' ng-click='addFilter()' x-translate>Add filter</a>"+
				"<span class='divider'>|</span>"+
				"<a href='' ng-click='clearFilter()' x-translate>Clear</a></li>"+
				"<span class='divider' ng-if='canExport()'>|</span>"+
				"<a href='' ng-if='canExport()' ui-grid-export x-translate>Export</a></li>"+
				"<span class='divider'>|</span>"+
				"<a href='' ng-click='applyFilter(true)' x-translate>Apply</a></li>"+
			"<div>"+
		"</div>"
	};
});

ui.directive('uiFilterBox', function() {

	return {
		scope: {
			handler: '='
		},
		controller: ['$scope', 'ViewService', 'DataSource', function($scope, ViewService, DataSource) {

			var handler = $scope.handler,
				params = (handler._viewParams || {}).params;

			var filterView = params ? params['search-filters'] : null;
			var filterDS = DataSource.create('com.axelor.meta.db.MetaFilter');

			this.$scope = $scope;
			$scope.model = handler._model;
			$scope.view = {};

			$scope.viewFilters = [];
			$scope.custFilters = [];

			if (filterView) {
				ViewService.getMetaDef($scope.model, {name: filterView, type: 'search-filters'})
				.success(function(fields, view) {
					$scope.view = view;
					$scope.viewFilters = angular.copy(view.filters);
				});
			} else {
				filterView = 'act:' + (handler._viewParams || {}).action;
			}

			if (filterView) {
				filterDS.rpc('com.axelor.meta.web.MetaUserController:findFilters', {
					model: 'com.axelor.meta.db.MetaFilter',
					context: {
						filterView: filterView
					}
				}).success(function(res) {
					_.each(res.data, function(item) {
						acceptCustom(item);
					});
				});
			}

			var current = {
				criteria: {},
				domains: [],
				customs: []
			};

			function acceptCustom(filter) {

				var custom = {
					title: filter.title,
					name: filter.name,
					shared: filter.shared,
					criteria: angular.fromJson(filter.filterCustom)
				};
				custom.selected = filter.filters ? filter.filters.split(/\s*,\s*/) : [];
				custom.selected = _.map(custom.selected, function(x) {
					return parseInt(x);
				});

				var found = _.findWhere($scope.custFilters, {name: custom.name});
				if (found) {
					_.extend(found, custom);
				} else {
					$scope.custFilters.push(custom);
				}
			}

			$scope.selectFilter = function(filter, isCustom, live) {

				var selected = live ? !filter.$selected : filter.$selected;
				var selection = isCustom ? current.customs : current.domains;

				if (live) {
					$scope.onClear();
				}

				filter.$selected = selected;

				var index = selection.indexOf(filter);
				if (selected) {
					selection.push(filter);
				} else if (index > -1) {
					selection.splice(index, 1);
				}

				if (isCustom && live) {
					$scope.custName = filter.$selected ? filter.name : null;
					$scope.custTitle = filter.$selected ? filter.title : '';
					$scope.custShared = filter.$selected ? filter.shared : false;
					return $scope.$broadcast('on:select-custom', filter, selection);
				}

				if (live) {
					$scope.onFilter();
				}
			};

			$scope.isSelected = function(filter) {
				return filter.$selected;
			};

			$scope.onRefresh = function() {
				if (this.custTerm) {
					return this.onFreeSearch();
				}
				handler.onRefresh();
			};

			$scope.hasFilters = function(which) {
				if (which === 1) {
					return this.viewFilters && this.viewFilters.length;
				}
				if (which === 2) {
					return this.custFilters && this.custFilters.length;
				}
				return (this.viewFilters && this.viewFilters.length) ||
					   (this.custFilters && this.custFilters.length);
			};

			$scope.canSaveNew = function() {
				if ($scope.custName && $scope.custTitle) {
					return !angular.equals($scope.custName, _.underscored($scope.custTitle));
				}
				return false;
			};

			$scope.onSave = function(saveAs) {

				var data = { criteria: null };
				$scope.$broadcast('on:before-save', data);

				var title = _.trim($scope.custTitle),
					name = $scope.custName || _.underscored(title);

				if (saveAs) {
					name = _.underscored(title);
				}

				var selected = new Array();

				_.each($scope.viewFilters, function(item, i) {
					if (item.$selected) selected.push(i);
				});

				var custom = data.criteria || {};

				custom = _.extend({
					operator: custom.operator,
					criteria: custom.criteria
				});

				var value = {
					name: name,
					title: title,
					shared: $scope.custShared,
					filters: selected.join(', '),
					filterView: filterView,
					filterCustom: angular.toJson(custom)
				};

				filterDS.rpc('com.axelor.meta.web.MetaUserController:saveFilter', {
					model: 'com.axelor.meta.db.MetaFilter',
					context: value
				}).success(function(res) {
					acceptCustom(res.data);
				});
			};

			$scope.onDelete = function() {

				var name = $scope.custName;
				if (!name) {
					return;
				}

				function doDelete() {
					filterDS.rpc('com.axelor.meta.web.MetaUserController:removeFilter', {
						model: 'com.axelor.meta.db.MetaFilter',
						context: {
							name: name,
							filterView: filterView
						}
					}).success(function(res) {
						var found = _.findWhere($scope.custFilters, {name: name});
						if (found) {
							$scope.custFilters.splice($scope.custFilters.indexOf(found), 1);
							$scope.custName = null;
							$scope.custTitle = null;
							$scope.custShared = false;
						}
						$scope.onFilter();
					});
				}

				axelor.dialogs.confirm(_t("Would you like to remove the filter?"), function(confirmed){
					if (confirmed) {
						doDelete();
					}
				});
			};

			$scope.onClear = function() {

				_.each($scope.viewFilters, function(d) { d.$selected = false; });
				_.each($scope.custFilters, function(d) { d.$selected = false; });

				current.domains.length = 0;
				current.customs.length = 0;

				$scope.custName = null;
				$scope.custTitle = null;
				$scope.custShared = false;
				$scope.custTerm = null;
			};

			$scope.onFilter = function(criteria) {

				if (criteria) {
					current.criteria = criteria;
				} else {
					criteria = current.criteria;
				}

				var search = _.extend({}, criteria);
				if (search.criteria == undefined) {
					search.operator = 'and';
					search.criteria = [];
				} else {
					search.criteria = _.clone(search.criteria);
				}

				var domains = [],
					customs = [];

				_.each(current.domains, function(domain) {
					domains.push(domain);
				});

				_.each(current.customs, function(custom) {
					if (custom.criteria && custom.criteria.criteria) {
						customs.push({
							operator: custom.criteria.operator || 'and',
							criteria: custom.criteria.criteria
						});
					}
					_.each(custom.selected, function(i) {
						var domain = $scope.viewFilters[i];
						if (domains.indexOf(domain) == -1) {
							domains.push(domain);
						}
					});
				});

				search._domains = domains;

				if (customs.length > 0) {
					search.criteria.push({
						operator: criteria.operator || 'and',
						criteria: customs
					});
				}

				handler.filter(search);
			};

			$scope.onFreeSearch = function() {

				var filters = new Array(),
					fields = {},
					text = this.custTerm,
					number = +(text);

				fields = _.extend({}, this.$parent.fields, this.fields);
				text = text ? text.trim() : null;

				if (this.nameField && text) {
					filters.push({
						fieldName: this.nameField,
						operator: 'like',
						value: text
					});
				}

				for(var name in fields) {

					if (name === this.nameField || !text) continue;

					var fieldName = null,
						operator = "like",
						value = text;

					var field = fields[name];

					switch (field.type) {
					case 'integer':
					case 'decimal':
						if (_.isNaN(number) || !text || !_.isNumber(number)) continue;
						fieldName = name;
						operator = '=';
						value = number;
						break;
					case 'string':
						fieldName = name;
						break;
					case 'many-to-one':
						if (field.targetName) {
							fieldName = name + '.' + field.targetName;
						}
						break;
					case 'boolean':
						if (/^(t|f|y|n|true|false|yes|no)$/.test(text)) {
							fieldName = name;
							operator = '=';
							value = /^(t|y|true|yes)$/.test(text);
						}
						break;
					}

					if (!fieldName) continue;

					filters.push({
						fieldName: fieldName,
						operator: operator,
						value: value
					});
				}

				var criteria = {
					operator: 'or',
					criteria: filters
				};

				this.onFilter(criteria);
			};
		}],
		link: function(scope, element, attrs) {

			var menu = element.children('.filter-menu'),
				toggleButton = null;

			scope.onSearch = function(e) {
				if (menu && menu.is(':visible')) {
					return hideMenu();
				}
				toggleButton = $(e.currentTarget);
				menu.show();
				menu.position({
					my: "left top",
					at: "left bottom",
					of: element
				});
				$(document).on('mousedown.search-menu', onMouseDown);
				
				scope.applyLater(function () {
					scope.visible = true;
				});
			};
			
			// append menu to view page to overlap the view
			scope.$timeout(function() {
				element.parents('.view-container').after(menu);
			});

			element.on('keydown.search-query', '.search-query', function(e) {
				if (e.keyCode === 13) { // enter
					scope.onFreeSearch();
				}
			});
			
			scope.$on('on:hide-menu', function () {
				hideMenu();
			});

			function hideMenu() {
				$(document).off('mousedown.search-menu', onMouseDown);
				scope.applyLater(function () {
					scope.visible = false;
				});
				return menu.hide();
			}

			function onMouseDown(e) {
				var all = $(menu).add(toggleButton);
				if (all.is(e.target) || all.has(e.target).size() > 0) {
					return;
				}
				all = $('.ui-widget-overlay,.ui-datepicker:visible,.ui-dialog:visible');
				if (all.is(e.target) || all.has(e.target).size() > 0) {
					return;
				}
				if(menu){
					hideMenu();
				}
			}

			element.on('$destroy', function() {
				$(document).on('mousedown.search-menu', onMouseDown);
				if (menu) {
					menu.remove();
					menu = null;
				}
			});
		},
		replace: true,
		template:
		"<div class='filter-box'>" +
			"<input type='text' class='search-query' ng-model='custTerm'>" +
			"<span class='search-icons'>" +
				"<i ng-click='onSearch($event)' class='icon-caret-down'></i>"+
				"<i ng-click='onRefresh()' class='icon-search'></i>" +
			"</span>" +
			"<div class='filter-menu' ui-watch-if='visible'>"+
				"<div class='filter-list'>" +
					"<dl ng-show='hasFilters(1)'>" +
						"<dt><i class='icon-save'></i><span x-translate> Filters</span></dt>" +
						"<dd ng-repeat='filter in viewFilters' class='checkbox'>" +
							"<input type='checkbox' " +
								"ng-model='filter.$selected' " +
								"ng-click='selectFilter(filter, false, false)'> " +
							"<a href='' ng-click='selectFilter(filter, false, true)'>{{filter.title}}</a>" +
						"</dd>" +
					"</dl>" +
					"<dl ng-show='hasFilters(2)'>" +
						"<dt><i class='icon-filter'></i><span x-translate> My Filters</span></dt>" +
						"<dd ng-repeat='filter in custFilters' class='checkbox'>" +
							"<input type='checkbox' " +
								"ng-model='filter.$selected' " +
								"ng-click='selectFilter(filter, true, false)'> " +
							"<a href='' ng-click='selectFilter(filter, true, true)'>{{filter.title}}</a>" +
						"</dd>" +
					"</dl>" +
				"</div>" +
				"<hr ng-show='hasFilters()'>" +
				"<div ui-filter-form x-model='model'></div>" +
				"<hr>" +
				"<div class='form-inline'>" +
					"<div class='control-group'>" +
						"<input type='text' placeholder='{{\"Save filter as\" | t}}' ng-model='custTitle'> " +
						"<label class='checkbox'>" +
							"<input type='checkbox' ng-model='custShared'><span x-translate>Share</span>" +
						"</label>" +
					"</div>" +
					"<button class='btn btn-small' ng-click='onSave()' ng-disabled='!custTitle'><span x-translate>Save</span></button> " +
					"<button class='btn btn-small' ng-click='onSave(true)' ng-show='canSaveNew()'><span x-translate>Save as</span></button> " +
					"<button class='btn btn-small' ng-click='onDelete()' ng-show='custName'><span x-translate>Delete</span></button>" +
				"</div>" +
			"</div>" +
		"</div>"
	};
});

}).call(this);
