function sub(url, vars) {
  let regex = /(\{\w+\})/g,
    match,
    key;

  // Find all the variables in the url that we will need to replace
  // with the appropriate properties from the model later on to
  // generate a specific link for the model itself.
  while (true) {
    match = regex.exec(url);
    if (!match) break;

    key = match[1].slice(1, match[1].length-1);

    // In the best case, the variable maps directly to a property value. If
    // that is true then perform the replacement and call it a day.
    // Otherwise, start investigating the possibile nested property cases.
    if (vars[key] !== undefined) {
      url = url.replace(match[1], vars[key]);
    }
  }

  return url;
};


export default { sub }
