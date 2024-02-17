/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{ejs,html}"],
  theme: {
    extend: {
      colors: {
        primary_light: "#4E9291",
        dark: "#0F2625 ",
        light: "#F0F0F0",
        primary: "#3E8382",
        secondary: "#9DADAF",
        alt_brown: "#A96A38",
        dark_green: "#4A5E55",
      },
    },
    fontFamily: {
      // Note: This is @notapatch and not the docs
      //       I think what it is trying to say is that if you define
      //       a custom font here you are also removing the default
      //       font families sans, serif and mono.
      //
      sans: ["ui-sans-serif", "system-ui"],
      serif: ["ui-serif", "Georgia"],
      mono: ["ui-monospace", "SFMono-Regular"],
      display: ["Popins"],
      body: ['"Open Sans"'],
    },
  },
  plugins: [],
};
