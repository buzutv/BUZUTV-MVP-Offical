import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    isOpen: false,
    videoUrl: "",
    movieId: null,
    title: "",
    description: "",
    playlistInfo: null,
    poster_url: "",
    selectedVideo:null,
    playlistId:null,
    currentVideoIndex: 0,
    isSeries: false,
    seriesData: []

}
export const screenPlayer = createSlice({
    initialState:initialState,
    name:"screenPlayer",
    reducers:{
        openScreenPlayer:(state,action) =>{
            state.isOpen = true;
            state.videoUrl = action.payload.videoUrl;
            state.movieId = action.payload.movieId;
            state.title = action.payload.title;
            state.description = action.payload.description;
            state.currentVideoIndex = action.payload.currentVideoIndex;
            state.poster_url = action.payload.poster_url;
            state.selectedVideo = action.payload.selectedVideo;
            state.playlistId    = action.payload.playlistId;
            state.isSeries = action.payload.isSeries || false;
            state.seriesData = action.payload.seriesData || [];
        },
        closeScreenPlayer:(state) =>{
            state.isOpen = false;
            state.videoUrl = "";
            state.movieId = null;
            state.title = "";
            state.description = "";
            state.playlistInfo = null;
            state.poster_url = "";
            state.selectedVideo = null;
        },
        setPlaylistInfo:(state,action) =>{
            state.playlistInfo = action.payload.playlistInfo;
        },
        setCurrentVideoIndex:(state, action) => {
            state.currentVideoIndex = action.payload.currentVideoIndex
        },
        setisSeries:(state, action) => {
            state.isSeries = action.payload.isSeries
        },
        setSeriesData:(state, action) => {
            state.isSeries = true
            state.seriesData = action.payload.seriesData
        }


    }

})

export const {openScreenPlayer,setPlaylistInfo ,closeScreenPlayer, setCurrentVideoIndex,setisSeries,setSeriesData } = screenPlayer.actions;

export default screenPlayer.reducer;