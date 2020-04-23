module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      [
        "react-app", //
        { flow: false, typescript: true },
      ],
    ],
  };
};
