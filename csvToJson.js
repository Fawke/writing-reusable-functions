const fs = require('fs');
const readline = require('readline');
const EventEmitter = require('events');

function readFile(readStream) {
  return readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
}

function getFirstLine(eventEmitter) {
  return new Promise((resolve, reject) => {
    let isHeader = true;

    // FIXME: Handle error also
    eventEmitter.on('line', line => {
      if(isHeader) { isHeader = false; resolve(line); return; }
    });
  });
}

function getRows(rowsToSkip, eventEmitter) {
  const rowsEmitter = new EventEmitter();

  let skippedRows = 0;

  eventEmitter.on('line', line => {
    if(skippedRows < rowsToSkip) { 
      skippedRows += 1;
      
      return;
    }

    rowsEmitter.emit('row', line);
  });

  eventEmitter.on('close', () => {
    rowsEmitter.emit('end');
  });

  return rowsEmitter;
}

function getObjectFromCSVRow(header, row) {
  const headers = header.split(',');
  const cols = row.split(',');

  return headers.reduce((acc, h, i) => {
    const o = {};
    o[h] = cols[i];
    return Object.assign({}, acc, o);
  }, {});
}

(function csvToJson(readStream, writeStream) {
  const readFileEventEmitter = readFile(csvFile);


  getFirstLine(readFileEventEmitter).then(header => {
    const getObject = getObjectFromCSVRow.bind(null, header);

    rowEventEmitter = getRows(1, readFileEventEmitter);

    rowEventEmitter.on('row', row => {
      const row = getObject(row);

      // TODO: Filter Business Logic

      // FIXME: Doesn't handle commas correctly
      writeStream.write(JSON.stringify(row));
    });

    rowEventEmitter.on('end', () => {
      writeStream.end();
    });
  });
})(fs.createReadStream('./csvToJson'), fs.createWriteStream('./output.json'));
