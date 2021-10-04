const objFromArray = (arr, key = '_id') => arr.reduce((accumulator, current) => {
  accumulator[current[key]] = current;
  return accumulator;
}, {});

export default objFromArray;
