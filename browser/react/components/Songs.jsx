import React from 'react';

export default ({ currentSong, start, songs }) => (
  <table className='table'>
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Artists</th>
        <th>Genre</th>
      </tr>
    </thead>
    <tbody>
      {songs && songs.map(song => 
        <tr className={currentSong.id === song.id ? 'active' : ''} key={song.id}>
          <td>
            {currentSong.id !== song.id ?
              <button onClick={() => start(song, songs)} className="btn btn-default btn-xs">
                <span className="glyphicon glyphicon-play"></span>
              </button> 
              :
              null}
          </td>
          <td>{song.name}</td>
          <td>{song.artists.map(artist => artist.name).join(', ')}</td>
          <td>{song.genre}</td>
        </tr>
      )}
    </tbody>
  </table>
);