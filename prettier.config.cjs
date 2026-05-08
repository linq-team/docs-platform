/** @type {import("prettier").Config} */
module.exports = {
  singleQuote: true,
  printWidth: 110,
  plugins: [require.resolve('prettier-plugin-astro')],
};
