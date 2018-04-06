const { promisify } = require("util");
const { writeFile, readFile, exists } = require("fs");
const { join } = require("path");
const mkdirp = require("mkdirp");
const sh = require("shorthash");

const config = require("pkg-config")("playback", {
  root: false
}, {
  playbacks: "playbacks"
});

const fsWriteFile = promisify(writeFile);
const fsReadFile = promisify(readFile);
const fsExists = promisify(exists);
const mkdir = promisify(mkdirp);

const hash = str => sh.unique(str);
const jsonify = obj => JSON.stringify(obj, null, 2);

async function playback(options, fn) {
  const key = typeof options === 'object' && options.key && hash(options.key);

  if (!key) {
    throw new Error(
      'Please pass in a valid key. Be aware the key should be unique.'
    );
  }

  if (typeof fn !== 'function') {
    throw new Error(
      'Please pass in a valid request function.'
    );
  }

  const dir = join(config.playbacks, typeof options.folder === 'string' ? options.folder : '');

  if (!(await fsExists(dir))) {
    await mkdir(dir);
  }

  const file = join(dir, `${key}.json`);
  let cache = await fsExists(file) && JSON.parse(await fsReadFile(file));

  if (cache) {
    return cache.result;
  }

  cache = {
    key: options.key,
    result: await fn()
  };

  await fsWriteFile(file, jsonify(cache));    
  return cache.result;
}

module.exports = playback;