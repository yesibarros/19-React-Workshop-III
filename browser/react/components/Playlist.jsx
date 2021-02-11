import React from 'react';
import Songs from './Songs';
import SelectSongContainer from '../containers/SelectSongContainer';

export default class Playlist extends React.Component {
  componentDidMount() {
    this.props.selectPlaylist(this.props.playlistId);
  }

  componentDidUpdate(prevProps) {
    if(prevProps.playlistId !== this.props.playlistId) {
      this.props.selectPlaylist(this.props.playlistId);
    }
  }

  render() {
    const { playlist, currentSong, start, addSong } = this.props;
    return (
      <div>
        <h3>{ playlist.name }</h3>
        <Songs songs={playlist.songs} currentSong={currentSong} start={start} />
        { playlist.songs && !playlist.songs.length && <small>No songs.</small> }
        <hr />
        <SelectSongContainer addSong={addSong} />
      </div>
    )
  }
}
