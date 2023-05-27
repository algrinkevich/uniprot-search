import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

import Button, { ButtonType } from "../../components/button/button.component";
import FiltersPopup from "../../components/filters-popup/filters-popup.component";
import {
  fetchItems,
  SearchItem,
  selectFilters,
  selectItems,
  selectSearchQuery,
  setFilters,
  setSearchQuery,
} from "../../store/slices/entries.slice";
import { AppDispatch } from "../../store/store";

import { ReactComponent as FiltersIcon } from "../../assets/filters.svg";
import { ReactComponent as SortIcon } from "../../assets/sortIcon.svg";

import "./search-page.style.scss";

const SearchPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const items = useSelector(selectItems);
  const dispatch = useDispatch<AppDispatch>();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = useSelector(selectSearchQuery);
  const filters = useSelector(selectFilters);

  useEffect(() => {
    dispatch(setSearchQuery(searchParams.get("query") || ""));
    dispatch(
      setFilters({
        gene: searchParams.get("geneValue"),
        organism: {
          name: searchParams.get("organismName"),
          id: searchParams.get("organismValue"),
        },
        sequence: {
          from: searchParams.get("sequenceLengthFromValue"),
          to: searchParams.get("sequenceLengthToValue"),
        },
        annotationScore: searchParams.get("annotationScoreValue"),
        proteinWith: {
          name: searchParams.get("proteinWithName"),
          id: searchParams.get("proteinWithValue"),
        },
      })
    );
  }, [dispatch, searchParams]);

  useEffect(() => {
    dispatch(fetchItems({ query: searchQuery, filters }));

    const queryString = {
      query: searchQuery,
      geneValue: filters?.gene,
      organismName: filters?.organism?.name,
      organismValue: filters?.organism?.id,
      sequenceLengthFromValue: filters?.sequence?.from
        ? filters?.sequence?.from?.toString()
        : null,
      sequenceLengthToValue: filters?.sequence?.to
        ? filters?.sequence?.to?.toString()
        : null,
      annotationScoreValue: filters?.annotationScore,
      proteinWithValue: filters?.proteinWith?.id,
      proteinWithName: filters?.proteinWith?.name,
    };

    const cleanedUpQueryString = Object.fromEntries(
      Object.entries(queryString).filter(([_, v]) => !!v)
    ) as {
      [key: string]: string;
    };

    setSearchParams(cleanedUpQueryString);
  }, [searchQuery, dispatch, filters, setSearchParams]);

  const onSearch = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const newSearchQuery = (
        event.currentTarget.elements.namedItem("search") as HTMLInputElement
      ).value;

      dispatch(setSearchQuery(newSearchQuery || "*"));
    },
    [dispatch]
  );

  const showSearchResultsTitle = () => {
    if (items.length > 0 && searchQuery === "*") {
      return (
        <p className="results-title">{`${items.length} Search Results for "All"`}</p>
      );
    } else if (items.length > 0 && searchQuery) {
      return (
        <p className="results-title">{`${items.length} Search Results for "${searchQuery}"`}</p>
      );
    } else if (items.length === 0 && searchQuery) {
      return (
        <p className="results-title">{`0 Search Results for "${searchQuery}"`}</p>
      );
    }
  };

  const columns: ColumnsType<SearchItem> = [
    {
      title: "#",
      dataIndex: "index",
    },
    {
      title: (
        <Fragment>
          {"Entry"}
          <SortIcon />
        </Fragment>
      ),
      dataIndex: "accession",
      sorter: true,
    },
    {
      title: (
        <Fragment>
          {"Entry Names"}
          <SortIcon />
        </Fragment>
      ),
      dataIndex: "id",
      sorter: true,
    },
    {
      title: (
        <Fragment>
          {"Genes"}
          <SortIcon />
        </Fragment>
      ),
      dataIndex: "geneNames",
      sorter: true,
      render: (_, record) => record.geneNames.join(", "),
    },
    {
      title: (
        <Fragment>
          {"Organism"}
          <SortIcon />
        </Fragment>
      ),
      dataIndex: "organismName",
      sorter: true,
      width: "20%",
      render: (text, _, index) => <Tag key={`${text}-${index}`}>{text}</Tag>,
    },
    {
      title: (
        <Fragment>
          {"Subcellular Location"}
          <SortIcon />
        </Fragment>
      ),
      dataIndex: "ccSubcellularLocation",
      sorter: true,
      width: "30%",
      render: (_, record) => record.ccSubcellularLocation.join(", "),
    },
    {
      title: (
        <Fragment>
          {"Length"}
          <SortIcon />
        </Fragment>
      ),
      dataIndex: "length",
      sorter: true,
    },
  ];

  return (
    <div className="search-page-container">
      <form className="search-page-form" onSubmit={onSearch}>
        <input
          type="search"
          name="search"
          className="input-search"
          placeholder="Enter search value"
          ref={searchRef}
          defaultValue={searchQuery === "*" ? "" : searchQuery}
        />
        <Button buttonType={ButtonType.BASE} styleClasses="search-btn">
          {"Search"}
        </Button>
        <Button
          buttonType={ButtonType.FILTERS}
          onClick={() => setShowFilters((prev) => !prev)}
          type="button"
        >
          <FiltersIcon />
        </Button>
      </form>

      {showFilters && <FiltersPopup onClose={() => setShowFilters(false)} />}

      {showSearchResultsTitle()}

      {items.length > 0 ? (
        <Table
          columns={columns}
          dataSource={items}
          className="table-container"
          scroll={{ x: true, y: "calc(100vh - 16.5em)" }}
          pagination={false}
        />
      ) : (
        <p className="no-data-placeholder">
          {"No data to display"}
          <br /> {"Please start search to display results"}
        </p>
      )}
    </div>
  );
};

export default SearchPage;
