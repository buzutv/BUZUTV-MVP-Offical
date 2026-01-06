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
    currentVideoIndex: 0

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
        }


    }

})

export const {openScreenPlayer,setPlaylistInfo ,closeScreenPlayer, setCurrentVideoIndex } = screenPlayer.actions;

export default screenPlayer.reducer;