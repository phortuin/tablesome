(function(app) {

	let _data = {};
	let _filters = {};

	const defaults = {
		sortBy: 'name'
	};

	const state = {
		sortBy: '',
		activeFilters: [],
		visibleColumns: []
	};

	const ELEMENT = document.querySelector('[data-tablesome]');
	const HEADER_ELEMENT = ELEMENT.querySelector('#header');
	const BODY_ELEMENT = ELEMENT.querySelector('#body');
	const SELECT_COLUMNS_ELEMENT = document.querySelector('#select-columns-panel ul');

	function renderPartial(id, data) {
		const templateHtml = document.querySelector(`#${id}`).innerHTML;
		const template = Handlebars.compile(templateHtml);
		return template(data);
	}

	function renderHeader() {
		const filter_values = Object.keys(_data.columns).reduce((prev, curr) => {
			prev[curr] = _.uniq(_.map(_data.rows, row => {
				if (_.isObject(row[curr])) {
					return row[curr].value;
				} else {
					return row[curr];
				}
			}));
			return prev;
		}, {});

		Object.keys(_data.columns).forEach(column => {
			_data.columns[column].filter_values = filter_values[column];
		});
		HEADER_ELEMENT.innerHTML = renderPartial('table-header', { columns: _data.columns });
		updateHeaderButtons(state.sortBy);
		attachHeaderHandlers();
	}

	function updateHeaderButtons() {
		const sortEl = document.querySelector(`[data-sort="${state.sortBy}"]`);
		[].forEach.call(document.querySelectorAll('[data-sort]'), el => {
			el.classList.remove('active');
		});
		if (sortEl) {
			sortEl.classList.add('active');
		}
	}

	function renderBody() {
		const rows = _data.rows.reduce((prev, next) => {
			prev[next.id] = next;
			delete next.id;
			return prev;
		}, {});
		BODY_ELEMENT.innerHTML = renderPartial('table-body', { rows });
		attachBodyHandlers();
		document.querySelector('[data-select-all-rows]').checked = false;
	}

	function renderSelectColumns() {
		const columns = _.clone(_oData.columns);
		Object.keys(columns).forEach(column => {
			columns[column].visible = state.visibleColumns.indexOf(column) > -1;
		});
		SELECT_COLUMNS_ELEMENT.innerHTML = renderPartial('select-columns', { columns });
	}

	function addFilter(filterName) {
		state.activeFilters.push(filterName);
	}

	function removeFilter(filterName) {
		state.activeFilters = state.activeFilters.filter(item => item !== filterName);
	}

	function addColumn(columnName) {
		state.visibleColumns.push(columnName);
	}

	function removeColumn(columnName) {
		state.visibleColumns = state.visibleColumns.filter(item => item !== columnName);
	}

	function attachHeaderHandlers() {
		[].forEach.call(document.querySelectorAll('[data-sort]'), el => {
			el.addEventListener('click', event => {
				event.preventDefault();
				state.sortBy = event.currentTarget.dataset.sort;
				sortAndFilter();
				updateHeaderButtons();
				renderBody();
			});
		});

		[].forEach.call(document.querySelectorAll('[data-filter-rows]'), el => {
			el.addEventListener('change', event => {
				const filterName = event.currentTarget.name;
				const filterValue = event.currentTarget.value;
				// Compare as strings, and check for direct key => value match
				// OR key => object.value match
				removeFilter(filterName);
				if (filterValue !== 'all') {
					_filters[filterName] = row => `${row[filterName]}` === filterValue || `${row[filterName].value}` === filterValue;
					addFilter(filterName);
				}
				sortAndFilter();
				renderBody();
			});
		});
	}

	function attachBodyHandlers() {
		[].forEach.call(document.querySelectorAll('[data-select-row]'), el => {
			el.addEventListener('click', event => {
				if (event.currentTarget.checked) {
					event.currentTarget.parentNode.parentNode.classList.add('row-selected');
				} else {
					event.currentTarget.parentNode.parentNode.classList.remove('row-selected');
				}
			})
		});

		[].forEach.call(document.querySelectorAll('[data-select-all-rows]'), el => {
			el.addEventListener('click', event => {
				if (event.currentTarget.checked) {
					[].forEach.call(document.querySelectorAll('[data-select-row]'), el => {
						el.checked = false;
						el.click();
					});
				} else {
					[].forEach.call(document.querySelectorAll('[data-select-row]'), el => {
						el.checked = true;
						el.click();
					});
				}
			});
		});
	}

	function attachHandlers() {
		[].forEach.call(document.querySelectorAll('[data-filter]'), el => {
			el.addEventListener('click', event => {
				if (event.currentTarget.checked) {
					addFilter(event.currentTarget.dataset.filter);
				} else {
					removeFilter(event.currentTarget.dataset.filter);
				}
				sortAndFilter();
				renderBody();
			});
		});

		[].forEach.call(document.querySelectorAll('[data-select-column]'), el => {
			el.addEventListener('click', event => {
				if (event.currentTarget.checked) {
					addColumn(event.currentTarget.dataset.selectColumn);
				} else {
					removeColumn(event.currentTarget.dataset.selectColumn);
				}
				sortAndFilter();
				renderHeader();
				renderBody();
			});
		});
	}

	function attachPreferenceHandlers() {
		[].forEach.call(document.querySelectorAll('[data-show-alerts]'), el => {
			el.addEventListener('click', event => {
				if (event.currentTarget.checked) {
					ELEMENT.classList.add('show-alerts');
				} else {
					ELEMENT.classList.remove('show-alerts');
				}
			});
		});
	}

	function sortAndFilter() {
		_data = _.clone(_oData);

		// Filter; for each active filters, execute the
		// 'user' defined filter function
		state.activeFilters.forEach(filter => {
			_data.rows = _.filter(_data.rows, _filters[filter]);
		});

		// Hide invisible columns
		//
		// NOTE: this breaks row filtering by using the select box, since
		// that is built on the original _data.columns & _data.rows (I think)
		//
		_data.columns = _.pick(_data.columns, state.visibleColumns);
		_data.rows = _data.rows.map(item => {
			return _.pick(item, state.visibleColumns.concat(['id']));
		});

		// Sort; if sortBy property is an object (in case of alert message etc)
		// sort on the sortBy.value property
		_data.rows = _.sortBy(_data.rows, (obj) => {
			return _.isObject(obj[state.sortBy]) ? obj[state.sortBy].value : obj[state.sortBy]
		});
	}

	function init(data, filters) {
		_oData = _.clone(data);
		_filters = filters;
		state.sortBy = defaults.sortBy;
		state.visibleColumns = Object.keys(_oData.columns).filter(column => _oData.columns[column].visible !== false);
		sortAndFilter(defaults.sortBy);
		renderHeader(defaults.sortBy);
		renderBody();
		renderSelectColumns();
		attachHandlers();

		// Note: these kinds of handlers should come as a plugin, to avoid
		// Tablesome to grow into an ugly blob of exceptions and one-offs
		attachPreferenceHandlers();
	}

	app.init = init;

}(window.app = window.app || {}));

window.app.init({
	columns: {
		name: {
			title: 'Name',
			sortable: true
		},
		species: {
			title: 'Species',
			sortable: true,
			filterable: true
		},
		age: {
			title: 'Age',
			sortable: true,
			filterable: true
		},
		color: {
			title: 'Color',
			sortable: false,
			visible: false
		}
	},
	rows: [
		{
			id: 'milo',
			name: 'Milo',
			species: 'hond',
			age: 4,
			color: 'zwart'
		},
		{
			id: 'frits',
			name: {
				value: 'Frits',
				warning: true,
				alert: true,
				message: 'Kan gevaarlijk wezen'
			},
			species: 'kat',
			age: 9,
			color: 'vlekjes'
		},
		{
			id: 'george',
			name: 'George',
			species: {
				value: 'kip',
				alert: true
			},
			age: 1,
			color: 'zwart'
		},
		{
			id: 'sjem',
			name: 'Sjem',
			species: 'hond',
			age: 7,
			color: 'vlekjes'
		},
		{
			id: 'spike',
			name: 'Spike',
			species: 'hond',
			age: 9,
			color: 'zwart'
		},
		{
			id: 'hera',
			name: 'Hera',
			species: 'hond',
			age: {
				value: 9,
				warning: true,
				message: 'Hond wordt te oud'
			},
			color: 'bruin'
		}
	]
}, {
	species: row => row.species === 'hond',
	age_below_8: row => row.age < 8
});
