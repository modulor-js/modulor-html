export function bench(fn, times){
  let hz;
  let period;
  let totalTime;
  let startTime = new Date;
  let runs = 0;
  do {
    fn(runs);
    runs++;
    totalTime = new Date - startTime;
  } while (totalTime < 1000);

  // Convert milliseconds to seconds.
  //totalTime /= 1000;

  // period → how long each operation takes
  period = totalTime / runs;

  // hz → the number of operations per second.
  hz = 1 / period;

  // This can be shortened to:
  hz = (runs * 1000) / totalTime;

  return { totalTime, period, hz };
};
