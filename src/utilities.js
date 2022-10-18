export const id = () => {
  return Math.random()
    .toString(36)
    .slice(2)
    .replace(/[0-9-]+/g, "");
};
