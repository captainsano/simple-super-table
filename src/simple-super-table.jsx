import React from 'react/addons';
const T = React.PropTypes;
const {LinkedStateMixin} = React.addons;
import R from 'ramda';

import dataHelpers from './data-helpers';
import renderHelpers from './render-helpers';

// TODO: use ES6 class syntax when an alternative for mixins is available.
const SimpleSuperTable = React.createClass({
  mixins: [LinkedStateMixin],

  propTypes: {
    data: T.array.isRequired,
    columns: T.array.isRequired,
    primaryKeyGen: T.func.isRequired,
    filterableColumns: T.array,
    defaultSortColumn: T.string,
    defaultSortAscending: T.bool,
    sortableColumns: T.array,
    onRowClick: T.func,
    onColumnClick: T.func,
  },

  getDefaultProps: function() {
    return {
      defaultSortAscending: true,
    };
  },

  getInitialState: function() {
    const sortableColumns = R.defaultTo(dataHelpers.extractColkeys(this.props.columns), this.props.sortableColumns);

    return {
      filterText: '',
      sortColKey: R.defaultTo(sortableColumns[0], this.props.defaultSortColumn),
      sortAscending: this.props.defaultSortAscending,
    };
  },

  handleHeaderClick: function(e) {
    const colKey = e.currentTarget.getAttribute('data-col-key');
    if (R.isNil(this.props.sortableColumns) || R.contains(colKey, this.props.sortableColumns)) {
      this.setState({
        sortColKey: colKey,
        sortAscending: this.state.sortColKey === colKey ? !this.state.sortAscending : true,
      });
    }
  },

  handleRowClick: function(e) {
    if (!R.isNil(this.props.onRowClick)) {
      const primaryKey = e.currentTarget.getAttribute('data-primary-key');
      const foundRow = R.find((d) => R.equals(primaryKey, this.props.primaryKeyGen(d)))(this.props.data);
      if (!R.isNil(foundRow)) {
        this.props.onRowClick(foundRow);
      }
    }
  },

  handleColumnClick: function(e) {
    if (!R.isNil(this.props.onColumnClick)) {
      e.stopPropagation()
      const colKey = e.currentTarget.getAttribute('data-col-key');
      const primaryKey = e.currentTarget.getAttribute('data-primary-key');
      const foundRow = R.find((d) => R.equals(primaryKey, this.props.primaryKeyGen(d)))(this.props.data);
      if (!R.isNil(foundRow)) {
        this.props.onColumnClick(foundRow[colKey], foundRow, colKey);
      }
    }
  },

  render: function() {
    const colKeys = dataHelpers.extractColkeys(this.props.columns);
    const filterableColumns = R.defaultTo(colKeys, this.props.filterableColumns);
    const filteredData = R.ifElse(
      R.isEmpty,
      () => this.props.data,
      () => dataHelpers.filterData(filterableColumns, this.state.filterText, this.props.data)
    )(filterableColumns);
    const sortedFilteredData = dataHelpers.sortData(this.state.sortColKey, this.state.sortAscending, filteredData);
    const filterTextInput = R.ifElse(
      R.isEmpty,
      () => null,
      () => <input type="search" valueLink={this.linkState('filterText')} />
    )(filterableColumns);

    return (
      <div>
        {filterTextInput}
        <table>
          <thead>
          <tr>
            {R.map(renderHelpers.renderHeader(this.handleHeaderClick))(this.props.columns)}
          </tr>
          </thead>
          <tbody>
            {R.map(renderHelpers.renderRow(this.props.primaryKeyGen, colKeys, this.handleRowClick, this.handleColumnClick))(sortedFilteredData)}
          </tbody>
        </table>
      </div>
    );
  },
});

export default SimpleSuperTable;