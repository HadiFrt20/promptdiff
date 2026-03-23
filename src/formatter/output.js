function output(data, options = {}) {
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(options.render(data));
  }
}

module.exports = { output };
