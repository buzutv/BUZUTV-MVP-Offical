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
            if (action.payload.videoUrl !== undefined) state.videoUrl = action.payload.videoUrl;
            if (action.payload.movieId !== undefined) state.movieId = action.payload.movieId;
            if (action.payload.contentId !== undefined) state.contentId = action.payload.contentId;
            if (action.payload.title !== undefined) state.title = action.payload.title;
            if (action.payload.description !== undefined) state.description = action.payload.description;
            if (action.payload.currentVideoIndex !== undefined) state.currentVideoIndex = action.payload.currentVideoIndex;
            if (action.payload.poster_url !== undefined) state.poster_url = action.payload.poster_url;
            if (action.payload.selectedVideo !== undefined) state.selectedVideo = action.payload.selectedVideo;
            if (action.payload.playlistId !== undefined) state.playlistId = action.payload.playlistId;
            if (action.payload.isSeries !== undefined) state.isSeries = action.payload.isSeries;
            if (action.payload.seriesData !== undefined) state.seriesData = action.payload.seriesData;
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