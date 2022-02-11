import React, { useState, useRef } from 'react'
// import { makeStyles } from '@material-ui/core/styles';
import { Card, CardActionArea, CardActions, CardContent, Typography } from '@material-ui/core';
import AudioAnalyser from './AudioAnalyser'
import VolumeButton from './VolumeButton'

import useDimensions from './hooks/useDimensions'

// const useStyles = makeStyles({});

const Video = ({ isLocal, name, rtcClient, videoRef }) => {
    const [muted, setMuted] = useState(rtcClient.initialAudioMuted)
    const refCard = useRef(null)
    const dimensionsCard = useDimensions(refCard)
    const refVolumeButton = useRef(null)
    const dimensionsVolumeButton = useDimensions(refVolumeButton)
    // const classes = useStyles();

    return (
        <Card>
            <CardActionArea ref={refCard}>
                <video autoPlay={true} muted={isLocal || muted} ref={videoRef} width={ dimensionsCard.width } />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                        {name}
                    </Typography>
                </CardContent>
        </CardActionArea>
        <CardActions>
                <VolumeButton
                    isLocal={isLocal}
                    muted={muted}
                    refVolumeButton={refVolumeButton}
                    rtcClient={rtcClient}
                    setMuted={setMuted}
                />
                {
                    !muted
                    && videoRef.current
                    && videoRef.current.srcObject
                    && (
                        <AudioAnalyser
                            audio={videoRef.current.srcObject}
                            width={dimensionsCard.width - dimensionsVolumeButton.width - 40}
                        />
                    )}
                {/* <AudioVisualiser /> */}
        </CardActions>
        </Card>
    );
}

export default Video
