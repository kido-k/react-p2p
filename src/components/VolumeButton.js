import React from 'react'

import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton'
import VolumeOffIcon from '@material-ui/icons/VolumeOff'
import VolumeUpIcon from '@material-ui/icons/VolumeUp'

const useStyles = makeStyles({
    icon: {
        height: 38,
        width: 38
    }
})

const VolumeButton = ({ isLocal, muted, refVolumeButton, rtcClient, setMuted }) => {
    const Icon = muted ? VolumeOffIcon : VolumeUpIcon
    const classes = useStyles()

    return (
        <IconButton
            area-larbel="switch mute"
            ref={refVolumeButton}
            onClick={() => {
                setMuted((previousState) => !previousState)
                // 以下はlocal側だけで実行可能
                if (isLocal) rtcClient.toggleAudio()
            }}
        >
            <Icon className={classes.icon}/>
        </IconButton>
    )
}

export default VolumeButton