var AudioContext = window.AudioContext || window.webkitAudioContext;

if(!AudioContext) {
  alert('sorry, you\'ll need a different browser');
}
