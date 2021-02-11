import React from 'react';
import ErrorDisplay from './ErrorDisplay';

export default ({ songs, selectedSong, handleSubmit, handleChange, error }) => (
  <div className="well">
  <form className="form-horizontal" noValidate name="songSelect" onSubmit={handleSubmit}>
    <fieldset>
      <legend>Add to Playlist</legend>
      <div className="form-group">
        <label htmlFor="song" className="col-xs-2 control-label">Song</label>
        <div className="col-xs-10">
          <select onChange={handleChange} className="form-control" name="song">
            {
              songs.map(song =>
                <option key={song.id} value={song.id}>{song.name}</option>
              )
            }
          </select>
        </div>
      </div>
      { error ? <ErrorDisplay>The song is already in the playlist</ErrorDisplay> : null}
      <div className="form-group">
        <div className="col-xs-10 col-xs-offset-2">
          <button type="submit" className="btn btn-success">Add Song</button>
        </div>
      </div>
    </fieldset>
  </form>
</div>
);