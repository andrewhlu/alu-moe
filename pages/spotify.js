import Title from "../components/title";
import { useState } from "react";
import SpotifyPlayer from 'react-spotify-web-playback';

export default function HomePage() {
    let [ tracks, setTracks ] = useState(["spotify:track:6klpXs2uAjagnZMFkt4qkl",""]);
    console.log(tracks);

    const changeTracks = () => {
        setTracks(["spotify:track:7tUSJY4nsDBJTjd1UXKRsT",""]);
    };

    return (
        <>
            <Title></Title>
            <SpotifyPlayer
                token="<access_token>"
                uris={tracks}
                autoplay={true}
                play={true}
            />;
            <p>{tracks}</p>
            <button onClick={changeTracks}>the magicc button</button>
        </>
    );
}