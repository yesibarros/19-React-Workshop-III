import React from 'react';
import axios from 'axios';
import { Route, Redirect, Switch } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Player from '../components/Player';
import Albums from '../components/Albums';
import SingleAlbum from '../components/SingleAlbum';
import audio from '../audio';
import FilterableArtistsContainer from './FilterableArtistsContainer';
import Artist from '../components/Artist';
import Playlist from '../components/Playlist';
import NewPlaylistContainer from '../containers/NewPlaylistContainer';

export default class Main extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      albums: [],
      selectedAlbum: {},
      currentSong: {},
      isPlaying: false,
      currentSongList: [],
      progress: 0,
      artists: [],
      selectedArtist: {
        name: '',
        albums: [],
        songs: []
      },
      playlists: [],
      selectedPlaylist: {},
    };
    this.selectAlbum = this.selectAlbum.bind(this);
    this.start = this.start.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.selectArtist = this.selectArtist.bind(this);
    this.addPlaylist = this.addPlaylist.bind(this);
    this.selectPlaylist = this.selectPlaylist.bind(this);
    this.addSong = this.addSong.bind(this);
  }
  
  componentDidMount() {
    axios.get('/api/albums')
      .then(res => res.data)
      .then(albums => this.setState({ albums }));

    axios.get('/api/artists')
      .then(res => res.data)
      .then(artists => this.setState({ artists }));
    
    axios.get('/api/playlists')
      .then(res => res.data)
      .then(playlists => this.setState({ playlists }));

    audio.addEventListener('ended', () => {
      this.next();
    });
    audio.addEventListener('timeupdate', () => {
      this.setState({
        progress: 100 * audio.currentTime / audio.duration
      });
    });
  }
  
  selectAlbum(albumId) {
    axios.get(`/api/albums/${albumId}`)
      .then(res => res.data)
      .then(serverAlbum => this.setState({ selectedAlbum: serverAlbum }));
  }

  selectArtist(artistId) {
    const artistPromise = axios.get(`/api/artists/${artistId}`).then(res => res.data);
    const songsPromise = axios.get(`/api/artists/${artistId}/songs`).then(res => res.data);
    const albumsPromise = axios.get(`/api/artists/${artistId}/albums`).then(res => res.data);
    Promise.all([artistPromise, songsPromise, albumsPromise])
      .then(([artist, songs, albums]) =>
        this.setState({
          selectedArtist: {
            name: artist.name,
            albums,
            songs,
          }
        }));
  }

  selectPlaylist(playlistId) {
    axios.get(`/api/playlists/${playlistId}`)
      .then(res => res.data)
      .then(playlist => {
        console.log(playlist)
        this.setState({
          selectedPlaylist: playlist,
        });
      });
  }

  addPlaylist(name) {
    axios.post('/api/playlists', { name })
      .then(res => res.data)
      .then(playlist => {
        this.setState({
          playlists: [playlist, ...this.state.playlists]
        });
        this.props.history.push(`/playlists/${playlist.id}`)
      });
  }

  addSong(id) {
    return axios.post(`/api/playlists/${this.state.selectedPlaylist.id}/songs`, { id })
      .then(res => res.data)
      .then(song => {
        this.setState({
          selectedPlaylist: {
            ...this.state.selectedPlaylist,
            songs: [song, ...this.state.selectedPlaylist.songs]
          }
        });
      });
  }
  start(song, songs) {
    this.setState({ currentSong: song, currentSongList: songs })
    this.loadSong(song.audioUrl);
  }

  loadSong(audioUrl) {
    audio.src = audioUrl;
    audio.load();
    this.play();
  }

  play() {
    audio.play();
    this.setState({ isPlaying: true })
  }

  pause() {
    audio.pause();
    this.setState({ isPlaying: false })
  }
  
  findSongIndex() {
    return this.state.currentSongList.findIndex(song => song.id === this.state.currentSong.id);
  }

  next() {
    let index = this.findSongIndex() + 1;
    if (index >= this.state.currentSongList.length) {
      index = 0 
    }
    const song = this.state.currentSongList[index];
    this.setState({ currentSong: song })
    this.loadSong(song.audioUrl)
  }

  previous() {
    let index = this.findSongIndex() - 1;
    if (index < 0) {
      index = this.state.currentSongList.length - 1 
    }
    const song = this.state.currentSongList[index];
    this.setState({ currentSong: song })
    this.loadSong(song.audioUrl)
  }

  render() {
    const  {
      albums,
      selectedAlbum,
      currentSong,
      isPlaying,
      progress,
      artists,
      selectedArtist,
      playlists,
      selectedPlaylist,
    } = this.state;
    return (
      <div id="main" className="container-fluid">
        <Sidebar playlists={playlists} />
        <div className="col-xs-10">
          <Switch>
            <Route exact path="/api/albums" render={() => console.log("aa") } />
            <Route exact path="/albums" render={() => <Albums albums={albums} /> } />
            <Route
              path="/albums/:id" 
              render={({ match }) => (
                <SingleAlbum 
                  selectAlbum={this.selectAlbum}
                  currentSong={currentSong}
                  start={this.start}
                  album={selectedAlbum} 
                  albumId={match.params.id} 
                />
              )} 
            />
            <Route path="/artists" exact render={() => <FilterableArtistsContainer artists={artists} />} />
            <Route path="/artists/:id" render={({ match }) => 
              <Artist
                artistId={match.params.id}
                url={match.url}
                path={match.path}
                artist={selectedArtist}
                start={this.start}
                currentSong={currentSong}
                selectArtist={this.selectArtist} />}
              />
            
            <Route path="/playlists/new" render={() => <NewPlaylistContainer addPlaylist={this.addPlaylist} />} />
            
            <Route path="/playlists/:id" render={({ match }) =>
              <Playlist
                playlistId={match.params.id}
                playlist={selectedPlaylist}
                start={this.start}
                currentSong={currentSong}
                selectPlaylist={this.selectPlaylist}
                addSong={this.addSong}
              />} 
            />

            <Redirect from="/" to="/albums" />
          </Switch>
        </div>
        <Player 
          currentSong={currentSong}
          isPlaying={isPlaying} 
          play={this.play} 
          pause={this.pause}
          next={this.next}
          previous={this.previous}
          progress={progress}
        />
      </div>
    );
  }
};