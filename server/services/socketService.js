let ioInstance = null;

function init(io) {
  ioInstance = io;
}

function emitAqiUpdate(data) {
  if (ioInstance) ioInstance.emit('aqi_update', data);
}

function emitSourcesUpdate(data) {
  if (ioInstance) ioInstance.emit('sources_update', data);
}

function emitForecastUpdate(data) {
  if (ioInstance) ioInstance.emit('forecast_update', data);
}

module.exports = {
  init,
  emitAqiUpdate,
  emitSourcesUpdate,
  emitForecastUpdate
};
