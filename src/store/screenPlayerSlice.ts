import { createSlice } from "@reduxjs/toolkit";
import { title } from "process";

const initialState = {
    isOpen: false,
    videoUrl: "",
    movieId: null,
    title: "",
    description: "",
    playlistInfo: null,
    poster_url: "",
    selectedVideo:null

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
            state.playlistInfo = action.payload.playlistInfo;
            state.poster_url = action.payload.poster_url;
            state.selectedVideo = action.payload.selectedVideo;
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


    }

})

export const {openScreenPlayer,closeScreenPlayer} = screenPlayer.actions;

export default screenPlayer.reducer;