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
		HEADER_ELEMENT.innerHTML = renderPartial('table-header', { columns: _data.columns });
		updateHeaderButtons(state.sortBy);
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
		BODY_ELEMENT.innerHTML = renderPartial('table-body', { rows: _data.rows });
	}

	function renderSelectColumns() {
		SELECT_COLUMNS_ELEMENT.innerHTML = renderPartial('select-columns', { columns: _oData.columns });
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
				renderBody();
				renderHeader();
				attachHeaderHandlers();
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
		_data.columns = _.pick(_data.columns, state.visibleColumns);
		_data.rows = _data.rows.map(item => {
			return _.pick(item, state.visibleColumns);
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
		state.visibleColumns = Object.keys(_oData.columns).filter(column => _oData.columns[column].visible);
		sortAndFilter(defaults.sortBy);
		renderHeader(defaults.sortBy);
		renderBody();
		renderSelectColumns();
		attachHandlers();
		attachHeaderHandlers();
	}

	app.init = init;

}(window.app = window.app || {}));

window.app.init({
	columns: {
		name: {
			title: 'Name',
			sortable: true,
			visible: true
		},
		species: {
			title: 'Species',
			sortable: true,
			visible: true
		},
		age: {
			title: 'Age',
			sortable: true,
			visible: true
		},
		color: {
			title: 'Color',
			sortable: false,
			visible: false
		}
	},
	rows: [
		{
			name: 'Milo',
			species: 'hond',
			age: 4,
			color: 'zwart'
		},
		{
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
			name: 'George',
			species: {
				value: 'kip',
				alert: true
			},
			age: 1,
			color: 'zwart'
		},
		{
			name: 'Sjem',
			species: 'hond',
			age: 7,
			color: 'vlekjes'
		},
		{
			name: 'Hera',
			species: 'hond',
			age: {
				value: 11,
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
