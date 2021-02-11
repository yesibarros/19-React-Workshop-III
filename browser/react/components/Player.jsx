import React from 'react';

export default ({ currentSong, isPlaying, play, pause, next, previous, progress }) => (
  currentSong.id ?
    <footer>
      <div className="pull-left">
        <button onClick={previous} className="btn btn-default">
          <span className="glyphicon glyphicon-step-backward"></span>
        </button>
        { isPlaying ? 
        <button onClick={pause} className="btn btn-default">
          <span className="glyphicon glyphicon-pause"></span>
        </button>
        :
        <button onClick={play} className="btn btn-default">
          <span className="glyphicon glyphicon-play"></span>
        </button>
        }
        <button onClick={next} className="btn btn-default">
          <span className="glyphicon glyphicon-step-forward"></span>
        </button>
      </div>
      <div className="bar">
        <div className="progress">
          <div className="progress-bar" style={{width: `${progress}%`}}></div>
        </div>
      </div>
    </footer>
    :
    null
);
