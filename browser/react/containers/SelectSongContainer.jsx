import React from 'react';
import axios from 'axios';
import SelectSong from '../components/SelectSong';

export default class SelectSongContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedSong: null,
      songs: [],
      error: false,
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    axios.get('/api/songs')
      .then(res => res.data)
      .then(songs => {
        this.setState({
          songs,
          selectedSong: songs[0].id
        });
      });
  }

  handleChange(evt) {
    this.setState({
      selectedSong: evt.target.value,
    });
  }

  handleSubmit(evt) {
    evt.preventDefault();
    this.props.addSong(this.state.selectedSong)
      .then(() => this.setState({ error: false }))
      .catch(() => this.setState({ error: true }));
  }

  render() {
    return (
      <SelectSong
        songs={this.state.songs}
        selectedSong={this.state.selectedSong}
        handleChange={this.handleChange}
        handleSubmit={this.handleSubmit}
        error={this.state.error}
      />
    );
  }
}