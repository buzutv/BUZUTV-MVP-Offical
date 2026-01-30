import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    isOpen: false,
    videoUrl: "",
    contentId: null,
    movieId: null,
    title: "",
    description: "",
    playlistInfo: null,
    poster_url: "",
    selectedVideo: null,
    playlistId: null,
    currentVideoIndex: 0,
    isSeries: false,
    seriesData: [],
    contentModalOpen: false

}
export const screenPlayer = createSlice({
    initialState: initialState,
    name: "screenPlayer",
    reducers: {
        openScreenPlayer: (state, action) => {
            state.isOpen = true;
            state.videoUrl = action.payload.videoUrl || "";
            state.movieId = action.payload.movieId || null;
            state.contentId = action.payload.contentId || null;
            state.title = action.payload.title || "";
            state.description = action.payload.description || "";
            state.currentVideoIndex = action.payload.currentVideoIndex || 0;
            state.poster_url = action.payload.poster_url || "";
            state.selectedVideo = action.payload.selectedVideo || null;
            state.playlistId = action.payload.playlistId || null;
            state.isSeries = action.payload.isSeries || false;
            state.seriesData = action.payload.seriesData || [];
            state.playlistInfo = action.payload.playlistInfo || null;
        },
        closeScreenPlayer: (state) => {
            state.isOpen = false;
            state.videoUrl = "";
            state.movieId = null;
            state.title = "";
            state.description = "";
            state.playlistInfo = null;
            state.poster_url = "";
            state.selectedVideo = null;
            state.title = "";
            state.seriesData = [],
                state.contentModalOpen = !state.contentModalOpen
        },
        setPlaylistInfo: (state, action) => {
            state.playlistInfo = action.payload.playlistInfo;
        },
        setCurrentVideoIndex: (state, action) => {
            state.currentVideoIndex = action.payload.currentVideoIndex
        },
        setisSeries: (state, action) => {
            state.isSeries = action.payload.isSeries
        },
        setSeriesData: (state, action) => {
            state.isSeries = true
            state.seriesData = action.payload.seriesData
        },
        setContentId: (state, action) => {
            state.contentId = action.payload.contentId
        }


    }

})

export const { openScreenPlayer, setPlaylistInfo, closeScreenPlayer, setCurrentVideoIndex, setisSeries, setSeriesData, setContentId } = screenPlayer.actions;

export default screenPlayer.reducer;