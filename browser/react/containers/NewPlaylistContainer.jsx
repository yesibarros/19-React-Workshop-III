import React from 'react';
import axios from 'axios';
import NewPlaylist from '../components/NewPlaylist';

export default class NewPlaylistContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      invalidLength: true,
      hasChanged: false,
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(evt) {
    const value = evt.target.value;
    this.setState({
      value: value,
      invalidLength: value.length < 1 || value.length > 16,
      hasChanged: true,
    });
  }

  handleSubmit(evt) {
    evt.preventDefault();
    this.props.addPlaylist(this.state.value)
    this.setState({
      value: '',
    })
  }

  render() {
    return (
      <NewPlaylist
        handleChange={this.handleChange}
        handleSubmit={this.handleSubmit}
        value={this.state.value}
        invalidLength={this.state.invalidLength}
        hasChanged={this.state.hasChanged}
      />
    );
  }
}