import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import isEqual from "lodash/isEqual";

import {
  SearchParams,
  UniProtSearchResponse,
  UniprotService,
} from "../../api/uniprot-service";
import { RootState } from "../store";

export interface SearchItem {
  index: number;
  accession: string;
  id: string;
  organismName: string;
  geneNames: string[];
  ccSubcellularLocation: string[];
  length: number;
}

interface EntriesState {
  items: SearchItem[];
  search: SearchParams;
  nextPageLink: string | null;
  isSearchRunning: boolean;
  total: number;
}

const INITIAL_STATE: EntriesState = {
  items: [],
  search: { query: "" },
  nextPageLink: null,
  isSearchRunning: false,
  total: 0,
};

const searchResultsToStateItems = (searchResults: UniProtSearchResponse) => {
  return searchResults.results.map((r, index) => {
    return {
      index,
      accession: r.primaryAccession,
      id: r.uniProtkbId,
      organismName: r.organism.scientificName,
      geneNames: r.genes?.map((gene) => gene.geneName?.value || "") || [],
      ccSubcellularLocation:
        r.comments?.flatMap((comment) =>
          comment.subcellularLocations?.map((sl) => sl.location.value)
        ) || [],
      length: r.sequence.length,
    };
  });
};

export const entriesSlice = createSlice({
  name: "entries",
  initialState: INITIAL_STATE,
  reducers: {
    resetState(state) {
      Object.assign(state, INITIAL_STATE);
    },
    setSearchQuery(state, action) {
      state.search.query = action.payload;
    },
    setFilters(state, action) {
      if (isEqual(state.search.filters, action.payload)) {
        return;
      }

      state.search.filters = action.payload;
    },
    setSorting(state, action) {
      if (isEqual(state.search.sort, action.payload)) {
        return;
      }

      state.search.sort = { ...action.payload };
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.isSearchRunning = true;
      })
      .addCase(
        fetchItems.fulfilled,
        (
          state,
          action: {
            payload: {
              searchResults: UniProtSearchResponse;
              nextPageLink: string | null;
            };
          }
        ) => {
          state.isSearchRunning = false;
          state.nextPageLink = action.payload.nextPageLink;
          state.items = searchResultsToStateItems(action.payload.searchResults);
        }
      )
      .addCase(fetchNextItems.pending, (state) => {
        state.isSearchRunning = true;
      })

      .addCase(
        fetchNextItems.fulfilled,
        (
          state,
          action: {
            payload: {
              searchResults: UniProtSearchResponse;
              nextPageLink: string | null;
            };
          }
        ) => {
          state.isSearchRunning = false;
          state.nextPageLink = action.payload.nextPageLink;
          state.items = [
            ...state.items,
            ...searchResultsToStateItems(action.payload.searchResults),
          ].map((item, index) => ({ ...item, index }));
        }
      )
      .addCase(countItems.fulfilled, (state, action) => {
        state.total = action.payload;
      });
  },
});

export const fetchItems = createAsyncThunk(
  "entries/fetchItems",
  async (args: SearchParams) => {
    const service = new UniprotService();

    return service.searchAsync(args);
  }
);

export const fetchNextItems = createAsyncThunk(
  "entries/fetchNextItems",
  async (_, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    if (!state.entries.nextPageLink) {
      throw new Error("Next page link is empty!");
    }

    const response = await fetch(state.entries.nextPageLink);
    const link = new UniprotService().extractLinkFromResponse(response);
    const data = await response.json();

    return { searchResults: data, nextPageLink: link };
  }
);

export const countItems = createAsyncThunk(
  "entries/countItems",
  async (args: SearchParams) => {
    const service = new UniprotService();

    const facetResponse = await service.getFacetsAsync({
      searchParams: args,
      facetName: "reviewed",
    });

    return (
      facetResponse.facets
        ?.at(0)
        ?.values.reduce((acc, v) => acc + v.count, 0) || 0
    );
  }
);

export const { setSearchQuery, setFilters, setSorting, resetState } =
  entriesSlice.actions;

export const selectItems = (state: RootState) => state.entries.items;
export const selectSearchQuery = (state: RootState) =>
  state.entries.search.query;
export const selectFilters = (state: RootState) => state.entries.search.filters;
export const selectIsSearchRunning = (state: RootState) =>
  state.entries.isSearchRunning;
export const selectSorting = (state: RootState) => state.entries.search.sort;
export const selectTotal = (state: RootState) => state.entries.total;

export const entriesReducer = entriesSlice.reducer;
