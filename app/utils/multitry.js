/* eslint-disable no-empty */
export default function multitry(time, tries, func) {
  let counter = 0;
  const errors = [];
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      counter++;
      try {
        const value = func(counter);
        clearInterval(timer);
        resolve(value);
      } catch (e) {
        errors.push(e);
      }
      if (counter >= tries) {
        clearInterval(timer);
        reject(errors);
      }
    }, time);
  });
}
