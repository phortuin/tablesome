(function(app) {

	let _data = {};
	let _filters = {};

	const defaults = {
		sortBy: 'name'
	};

	const state = {
		sortBy: '',
		activeFilters: []
	};

	const ELEMENT = document.querySelector('[data-tablesome]');
	const HEADER_ELEMENT = ELEMENT.querySelector('#header');
	const BODY_ELEMENT = ELEMENT.querySelector('#body');

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

	function addFilter(filterName) {
		state.activeFilters.push(filterName);
	}

	function removeFilter(filterName) {
		state.activeFilters = state.activeFilters.filter(item => item !== filterName);
	}

	function attachHandlers() {
		[].forEach.call(document.querySelectorAll('[data-sort]'), el => {
			el.addEventListener('click', event => {
				event.preventDefault();
				state.sortBy = event.currentTarget.dataset.sort;
				sortAndFilter();
				updateHeaderButtons();
				renderBody();
			});
		});

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
	}

	function sortAndFilter() {
		_data = _.clone(_oData);

		// Hide invisible columns
		_data.columns = _.pickBy(_data.columns, item => item.visible === true);
		_data.visibleColumns = Object.keys(_data.columns);
		_data.rows = _data.rows.map(item => {
			return _.pick(item, _data.visibleColumns);
		});

		// Sort
		_data.rows = _.sortBy(_data.rows, state.sortBy);

		// Filter; for each active filters, execute the
		// 'user' defined filter function
		state.activeFilters.forEach(filter => {
			_data.rows = _.filter(_data.rows, _filters[filter]);
		});
	}

	function init(data, filters) {
		_oData = _.clone(data);
		_filters = filters;
		state.sortBy = defaults.sortBy;
		sortAndFilter(defaults.sortBy);
		renderHeader(defaults.sortBy);
		renderBody();
		attachHandlers();
	}

	app.init = init;

}(window.app = window.app || {}));

window.app.init({
	columns: {
		name: {
			title: 'Naam',
			sortable: true,
			visible: true
		},
		species: {
			title: 'Soort',
			sortable: true,
			visible: true
		},
		age: {
			title: 'Leeftijd',
			sortable: true,
			visible: true
		},
		color: {
			title: 'Kleur',
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
			name: 'Frits',
			species: 'kat',
			age: 9,
			color: 'vlekjes'
		},
		{
			name: 'George',
			species: 'kip',
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
			age: 11,
			color: 'bruin'
		}
	]
}, {
	species: row => row.species === 'hond',
	age_below_8: row => row.age < 8
});
