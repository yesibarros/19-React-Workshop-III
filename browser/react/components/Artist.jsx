import React from 'react';
import { Link, Route } from 'react-router-dom';
import Albums from './Albums';
import Songs from './Songs';

export default class Artist extends React.Component {

  componentDidMount() {
    this.props.selectArtist(this.props.artistId)
  }
  render() {
   const { currentSong, start, artist, url, path } = this.props;
    return (
      <div>
        <h3>{ artist.name }</h3>
        <ul className="nav nav-tabs">
          <li><Link to={`${url}/albums`}>ALBUMS</Link></li>
          <li><Link to={`${url}/songs`}>SONGS</Link></li>
        </ul>
        <Route path={`${path}/albums`} render={() => <Albums albums={artist.albums} /> }/>
        <Route path={`${path}/songs`} render={() => <Songs songs={artist.songs} start={start} currentSong={currentSong} />} />
      </div>
    );
  }
}